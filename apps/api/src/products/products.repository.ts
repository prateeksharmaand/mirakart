import { Injectable } from "@nestjs/common";
import type { Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const PRODUCT_SORT_FIELDS = ["createdAt", "name", "basePrice", "status"] as const;

interface SortableFilter {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PublicProductFilter extends SortableFilter {
  categoryId?: string;
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
  page: number;
  limit: number;
}

export interface AdminProductFilter extends SortableFilter {
  status?: ProductStatus;
  merchantId?: string;
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

  async findPublicList(filter: PublicProductFilter) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: "APPROVED",
      variants: { some: { deletedAt: null } },
      ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
      ...(filter.brandId ? { brandId: filter.brandId } : {}),
      ...(filter.isFeatured !== undefined ? { isFeatured: filter.isFeatured } : {}),
      ...(filter.minPrice !== undefined || filter.maxPrice !== undefined
        ? {
            basePrice: {
              ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}),
              ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {}),
            },
          }
        : {}),
      ...(filter.search
        ? { OR: [{ name: { contains: filter.search, mode: "insensitive" } }] }
        : {}),
      ...(filter.attributeValueIds && filter.attributeValueIds.length > 0
        ? {
            // Optimized: Instead of N AND conditions with nested queries, use a single variants.some
            // with ALL attribute values required (GROUP BY variant, HAVING COUNT = N)
            variants: {
              some: {
                deletedAt: null,
                attributeValues: {
                  every: {
                    attributeValueId: { in: filter.attributeValueIds },
                  },
                },
              },
            },
          }
        : {}),
      ...(filter.tagSlug
        ? { tags: { some: { tag: { slug: filter.tagSlug, isActive: true, deletedAt: null } } } }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { images: { where: { isPrimary: true }, take: 1, include: { media: true } }, brand: true },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, PRODUCT_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, totalItems };
  }

  findPublicBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: { slug, status: "APPROVED", deletedAt: null },
      include: productDetailInclude,
    });
  }

  async findMerchantList(filter: MerchantProductFilter) {
    const where: Prisma.ProductWhereInput = {
      merchantId: filter.merchantId,
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search ? { name: { contains: filter.search, mode: "insensitive" } } : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { images: { where: { isPrimary: true }, take: 1, include: { media: true } } },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, PRODUCT_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, totalItems };
  }

  async findAdminList(filter: AdminProductFilter) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.merchantId ? { merchantId: filter.merchantId } : {}),
    };

    const [items, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1, include: { media: true } },
          merchant: { select: { id: true, storeName: true } },
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, PRODUCT_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, totalItems };
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

  softDelete(id: string) {
    return this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // --- Variants ---

  findVariantById(id: string) {
    return this.prisma.productVariant.findFirst({ where: { id, deletedAt: null } });
  }

  findVariantBySku(sku: string) {
    return this.prisma.productVariant.findUnique({ where: { sku } });
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

  async addImage(data: { productId: string; mediaId: string; variantId?: string; isPrimary: boolean; sortOrder: number }) {
    return this.prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.productImage.updateMany({ where: { productId: data.productId }, data: { isPrimary: false } });
      }
      return tx.productImage.create({ data });
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
