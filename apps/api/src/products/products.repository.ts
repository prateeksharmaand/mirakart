import { Injectable } from "@nestjs/common";
import type { Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";
import type { StockStatusFilter } from "./dto/merchant-product-query.dto";

const PRODUCT_SORT_FIELDS = ["createdAt", "name", "basePrice", "status"] as const;

// Column-to-column comparisons (quantity <= lowStockThreshold) aren't
// expressible in a plain Prisma where-clause, so stock status is computed
// here rather than in SQL.
const stockSummaryInclude = {
  variants: {
    where: { deletedAt: null },
    select: { id: true, inventory: { select: { quantity: true, lowStockThreshold: true } } },
  },
} as const;

function withStockSummary<T extends { variants: { inventory: { quantity: number; lowStockThreshold: number } | null }[] }>(
  product: T,
) {
  const stockCount = product.variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0);
  const isLowStock = product.variants.some(
    (v) => v.inventory && v.inventory.quantity > 0 && v.inventory.quantity <= v.inventory.lowStockThreshold,
  );
  return { ...product, stockCount, isLowStock, isOutOfStock: stockCount === 0 };
}

// Cap for the unpaginated fetch used when filtering by computed stock
// status — bounded so a stock-status query can't load an unbounded catalog.
const STOCK_FILTER_SCAN_LIMIT = 2000;

interface SortableFilter {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PublicProductFilter extends SortableFilter {
  categoryId?: string;
  categoryIds?: string[];
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isFeatured?: boolean;
  attributeValueIds?: string[];
  tagSlug?: string;
  page: number;
  limit: number;
}

export interface MerchantProductFilter extends SortableFilter {
  merchantId: string;
  status?: ProductStatus;
  search?: string;
  stockStatus?: StockStatusFilter;
  page: number;
  limit: number;
}

export interface AdminProductFilter extends SortableFilter {
  status?: ProductStatus;
  merchantId?: string;
  search?: string;
  page: number;
  limit: number;
}

const productDetailInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, include: { media: true } },
  variants: {
    where: { deletedAt: null },
    include: {
      attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
      inventory: true,
    },
  },
  brand: true,
  category: true,
  tags: { include: { tag: true }, where: { tag: { isActive: true, deletedAt: null } } },
};

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildPublicWhere(
    filter: Pick<
      PublicProductFilter,
      | "categoryId"
      | "categoryIds"
      | "brandId"
      | "minPrice"
      | "maxPrice"
      | "search"
      | "isFeatured"
      | "attributeValueIds"
      | "tagSlug"
    >,
    includePriceFilter = true,
  ): Prisma.ProductWhereInput {
    return {
      deletedAt: null,
      status: "APPROVED",
      variants: { some: { deletedAt: null } },
      ...(filter.categoryIds && filter.categoryIds.length > 0
        ? { categoryId: { in: filter.categoryIds } }
        : filter.categoryId
          ? { categoryId: filter.categoryId }
          : {}),
      ...(filter.brandId ? { brandId: filter.brandId } : {}),
      ...(filter.isFeatured !== undefined ? { isFeatured: filter.isFeatured } : {}),
      ...(includePriceFilter && (filter.minPrice !== undefined || filter.maxPrice !== undefined)
        ? {
            basePrice: {
              ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}),
              ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {}),
            },
          }
        : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: "insensitive" } },
              { productCode: { contains: filter.search, mode: "insensitive" } },
              { sku: { contains: filter.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filter.attributeValueIds && filter.attributeValueIds.length > 0
        ? {
            // AND semantics: product must have at least one variant possessing EACH requested value
            AND: filter.attributeValueIds.map((avId) => ({
              variants: { some: { deletedAt: null, attributeValues: { some: { attributeValueId: avId } } } },
            })),
          }
        : {}),
      ...(filter.tagSlug
        ? { tags: { some: { tag: { slug: filter.tagSlug, isActive: true, deletedAt: null } } } }
        : {}),
    };
  }

  async findPublicList(filter: PublicProductFilter) {
    const where = this.buildPublicWhere(filter);

    const [items, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1, include: { media: true } },
          brand: true,
          variants: { where: { deletedAt: null }, select: { inventory: { select: { quantity: true } } } },
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, PRODUCT_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.product.count({ where }),
    ]);

    const reviewStats =
      items.length > 0
        ? await this.prisma.review.groupBy({
            by: ["productId"],
            where: { productId: { in: items.map((item) => item.id) }, isApproved: true, deletedAt: null },
            _avg: { rating: true },
            _count: { id: true },
          })
        : [];
    const statsByProductId = new Map(
      reviewStats.map((stat) => [
        stat.productId,
        { averageRating: stat._avg.rating ? Number(stat._avg.rating.toFixed(1)) : 0, reviewCount: stat._count.id },
      ]),
    );

    return {
      items: items.map((item) => ({
        ...item,
        ...(statsByProductId.get(item.id) ?? { averageRating: 0, reviewCount: 0 }),
        availableCount: item.variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0),
      })),
      totalItems,
    };
  }

  async getPriceRange(
    filter: Pick<
      PublicProductFilter,
      "categoryId" | "categoryIds" | "brandId" | "search" | "isFeatured" | "attributeValueIds" | "tagSlug"
    >,
  ): Promise<{ min: number; max: number }> {
    const where = this.buildPublicWhere(filter, false);
    const result = await this.prisma.product.aggregate({
      where,
      _min: { basePrice: true },
      _max: { basePrice: true },
    });
    return {
      min: result._min.basePrice ? Number(result._min.basePrice) : 0,
      max: result._max.basePrice ? Number(result._max.basePrice) : 0,
    };
  }

  findPublicBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: { slug, status: "APPROVED", deletedAt: null },
      include: productDetailInclude,
    });
  }

  async findActiveDeals(limit: number) {
    const items = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        status: "APPROVED",
        dealEndsAt: { gt: new Date() },
        variants: { some: { deletedAt: null } },
      },
      include: {
        images: { where: { isPrimary: true }, take: 1, include: { media: true } },
        brand: true,
        variants: { where: { deletedAt: null }, include: { inventory: true } },
      },
      orderBy: { dealEndsAt: "asc" },
      take: limit,
    });
    if (items.length === 0) return [];

    const productIds = items.map((item) => item.id);
    const [reviewStats, soldStats] = await Promise.all([
      this.prisma.review.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds }, isApproved: true, deletedAt: null },
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds }, status: { not: "CANCELLED" } },
        _sum: { quantity: true },
      }),
    ]);
    const reviewByProductId = new Map(
      reviewStats.map((stat) => [
        stat.productId,
        { averageRating: stat._avg.rating ? Number(stat._avg.rating.toFixed(1)) : 0, reviewCount: stat._count.id },
      ]),
    );
    const soldByProductId = new Map(soldStats.map((stat) => [stat.productId, stat._sum.quantity ?? 0]));

    return items.map((item) => ({
      ...item,
      ...(reviewByProductId.get(item.id) ?? { averageRating: 0, reviewCount: 0 }),
      soldCount: soldByProductId.get(item.id) ?? 0,
      availableCount: item.variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0),
    }));
  }

  async findMerchantList(filter: MerchantProductFilter) {
    const where: Prisma.ProductWhereInput = {
      merchantId: filter.merchantId,
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: "insensitive" } },
              { productCode: { contains: filter.search, mode: "insensitive" } },
              { sku: { contains: filter.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const include = {
      images: { where: { isPrimary: true }, take: 1, include: { media: true } },
      ...stockSummaryInclude,
    };
    const orderBy = buildOrderBy(filter.sortBy, filter.sortOrder, PRODUCT_SORT_FIELDS, "createdAt");

    if (filter.stockStatus) {
      // Stock status is a computed field, so this filter can't be pushed
      // into SQL — scan (bounded) and paginate in-process instead.
      const all = await this.prisma.product.findMany({ where, include, orderBy, take: STOCK_FILTER_SCAN_LIMIT });
      const withSummary = all.map(withStockSummary);
      const filtered = withSummary.filter((p) =>
        filter.stockStatus === "OUT_OF_STOCK" ? p.isOutOfStock : p.isLowStock && !p.isOutOfStock,
      );
      const start = (filter.page - 1) * filter.limit;
      return { items: filtered.slice(start, start + filter.limit), totalItems: filtered.length };
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: items.map(withStockSummary), totalItems };
  }

  async findAdminList(filter: AdminProductFilter) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.merchantId ? { merchantId: filter.merchantId } : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: "insensitive" } },
              { productCode: { contains: filter.search, mode: "insensitive" } },
              { sku: { contains: filter.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1, include: { media: true } },
          merchant: { select: { id: true, storeName: true } },
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          ...stockSummaryInclude,
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, PRODUCT_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: items.map(withStockSummary), totalItems };
  }

  findById(id: string) {
    return this.prisma.product.findFirst({ where: { id, deletedAt: null } });
  }

  findByIdWithDetail(id: string) {
    return this.prisma.product.findFirst({ where: { id, deletedAt: null }, include: productDetailInclude });
  }

  findBySlug(slug: string) {
    return this.prisma.product.findFirst({ where: { slug, deletedAt: null } });
  }

  create(data: {
    merchantId: string;
    categoryId: string;
    brandId?: string;
    name: string;
    slug: string;
    productCode: string;
    description: string;
    basePrice: number;
    compareAtPrice?: number;
    sku?: string;
    weight?: number;
    metaTitle?: string;
    metaDescription?: string;
    status: ProductStatus;
  }) {
    return this.prisma.product.create({ data });
  }

  findBrandCode(brandId: string): Promise<string | null> {
    return this.prisma.brand
      .findUnique({ where: { id: brandId }, select: { code: true } })
      .then((brand) => brand?.code ?? null);
  }

  countByBrand(brandId: string | null): Promise<number> {
    return this.prisma.product.count({ where: { brandId } });
  }

  update(
    id: string,
    data: Partial<{
      categoryId: string;
      brandId: string | null;
      name: string;
      description: string;
      basePrice: number;
      compareAtPrice: number | null;
      sku: string | null;
      weight: number | null;
      isFeatured: boolean;
      dealEndsAt: Date | null;
      metaTitle: string;
      metaDescription: string;
      status: ProductStatus;
      rejectionReason: string | null;
    }>,
  ) {
    return this.prisma.product.update({ where: { id }, data });
  }

  setApprovalStatus(
    id: string,
    data: { status: ProductStatus; approvedById?: string; approvedAt?: Date; rejectionReason?: string | null },
  ) {
    return this.prisma.product.update({ where: { id }, data });
  }

  setStatus(id: string, status: ProductStatus) {
    return this.prisma.product.update({ where: { id }, data: { status } });
  }

  softDelete(id: string) {
    return this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // --- Variants ---

  findVariantById(id: string) {
    return this.prisma.productVariant.findFirst({ where: { id, deletedAt: null } });
  }

  findVariantBySku(sku: string) {
    if (!sku) return Promise.resolve(null);
    return this.prisma.productVariant.findFirst({ where: { sku, deletedAt: null } });
  }

  async createVariant(data: {
    productId: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    weight?: number;
    attributeValueIds: string[];
  }) {
    return this.prisma.productVariant.create({
      data: {
        productId: data.productId,
        sku: data.sku,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        weight: data.weight,
        attributeValues: { create: data.attributeValueIds.map((attributeValueId) => ({ attributeValueId })) },
        inventory: { create: { quantity: 0 } },
      },
      include: { attributeValues: true, inventory: true },
    });
  }

  updateVariant(
    id: string,
    data: Partial<{ sku: string; price: number; compareAtPrice: number | null; weight: number | null }>,
  ) {
    return this.prisma.productVariant.update({ where: { id }, data });
  }

  softDeleteVariant(id: string) {
    return this.prisma.productVariant.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  countActiveVariants(productId: string): Promise<number> {
    return this.prisma.productVariant.count({ where: { productId, deletedAt: null } });
  }

  upsertInventory(variantId: string, data: { quantity: number; lowStockThreshold?: number }) {
    return this.prisma.inventory.upsert({
      where: { variantId },
      update: data,
      create: { variantId, ...data },
    });
  }

  // --- Images ---

  listImages(productId: string) {
    return this.prisma.productImage.findMany({
      where: { productId },
      include: { media: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async addImage(data: { productId: string; mediaId: string; variantId?: string; isPrimary: boolean; sortOrder: number }) {
    return this.prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.productImage.updateMany({ where: { productId: data.productId }, data: { isPrimary: false } });
      }
      return tx.productImage.create({ data, include: { media: true } });
    });
  }

  findImageById(id: string) {
    return this.prisma.productImage.findUnique({ where: { id } });
  }

  removeImage(id: string) {
    return this.prisma.productImage.delete({ where: { id } });
  }

  countImages(productId: string): Promise<number> {
    return this.prisma.productImage.count({ where: { productId } });
  }

  setPrimary(productId: string, imageId: string) {
    return this.prisma.$transaction([
      this.prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
      this.prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);
  }

  async reorderImages(items: { id: string; sortOrder: number }[]) {
    await this.prisma.$transaction(
      items.map((item) => this.prisma.productImage.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })),
    );
  }

  // --- Tags ---

  syncTags(productId: string, tagIds: string[]) {
    return this.prisma.$transaction([
      this.prisma.productTag.deleteMany({ where: { productId } }),
      ...(tagIds.length > 0
        ? [this.prisma.productTag.createMany({ data: tagIds.map((tagId) => ({ productId, tagId })) })]
        : []),
    ]);
  }
}
