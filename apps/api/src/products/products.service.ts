import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { slugify } from "../common/utils/slugify.util";
import { generateProductCode } from "./utils/product-code.util";
import { ProductsRepository } from "./products.repository";
import type { AddProductImageDto } from "./dto/add-product-image.dto";
import type { AdminProductQueryDto, MerchantProductQueryDto } from "./dto/merchant-product-query.dto";
import type { CreateProductDto } from "./dto/create-product.dto";
import type { CreateVariantDto } from "./dto/create-variant.dto";
import type { ProductQueryDto } from "./dto/product-query.dto";
import type { UpdateInventoryDto } from "./dto/update-inventory.dto";
import type { UpdateProductDto } from "./dto/update-product.dto";
import type { UpdateVariantDto } from "./dto/update-variant.dto";

function paginate(page: number, limit: number, totalItems: number) {
  return { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) };
}

const PRODUCT_CODE_RETRY_ATTEMPTS = 3;

@Injectable()
export class ProductsService {
  constructor(private readonly repo: ProductsRepository) {}

  // --- Public ---

  async listPublic(query: ProductQueryDto) {
    const { items, totalItems } = await this.repo.findPublicList({
      categoryId: query.categoryId,
      categoryIds: query.categoryIds,
      brandId: query.brandId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      search: query.search,
      isFeatured: query.isFeatured,
      attributeValueIds: query.attributeValueIds,
      tagSlug: query.tagSlug,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { data: items, meta: paginate(query.page, query.limit, totalItems) };
  }

  async getPriceRange(query: ProductQueryDto) {
    return this.repo.getPriceRange({
      categoryId: query.categoryId,
      categoryIds: query.categoryIds,
      brandId: query.brandId,
      search: query.search,
      isFeatured: query.isFeatured,
      attributeValueIds: query.attributeValueIds,
      tagSlug: query.tagSlug,
    });
  }

  async findPublicBySlug(slug: string) {
    const product = await this.repo.findPublicBySlug(slug);
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async getActiveDeals(limit: number) {
    return this.repo.findActiveDeals(limit);
  }

  // --- Merchant ---

  async listForMerchant(merchantId: string, query: MerchantProductQueryDto) {
    const { items, totalItems } = await this.repo.findMerchantList({
      merchantId,
      status: query.status,
      search: query.search,
      stockStatus: query.stockStatus,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { data: items, meta: paginate(query.page, query.limit, totalItems) };
  }

  async findMerchantProduct(id: string, merchantId: string) {
    return this.assertOwnedProduct(id, merchantId, true);
  }

  async create(merchantId: string, dto: CreateProductDto) {
    if (dto.compareAtPrice !== undefined && dto.compareAtPrice <= dto.basePrice) {
      throw new BadRequestException("compareAtPrice must be greater than basePrice");
    }
    const slug = await this.generateUniqueSlug(dto.name);
    const { tagIds, ...productData } = dto;
    const brandCode = productData.brandId ? await this.repo.findBrandCode(productData.brandId) : null;

    const product = await this.createWithRetry(merchantId, productData, slug, brandCode);

    if (tagIds && tagIds.length > 0) {
      await this.repo.syncTags(product.id, tagIds);
    }
    return product;
  }

  /** Product IDs are generated from a per-brand sequential count, so a
   *  concurrent create can race for the same code — retry with a freshly
   *  counted sequence on a unique-constraint collision, mirroring
   *  OrdersService's createOrderWithRetry for orderNumber. */
  private async createWithRetry(
    merchantId: string,
    productData: Omit<CreateProductDto, "tagIds">,
    slug: string,
    brandCode: string | null,
  ) {
    for (let attempt = 1; attempt <= PRODUCT_CODE_RETRY_ATTEMPTS; attempt++) {
      const sequence = (await this.repo.countByBrand(productData.brandId ?? null)) + 1;
      const productCode = generateProductCode(brandCode, sequence);
      try {
        return await this.repo.create({
          merchantId,
          categoryId: productData.categoryId,
          brandId: productData.brandId,
          name: productData.name,
          slug,
          productCode,
          description: productData.description,
          basePrice: productData.basePrice,
          compareAtPrice: productData.compareAtPrice,
          sku: productData.sku,
          weight: productData.weight,
          metaTitle: productData.metaTitle,
          metaDescription: productData.metaDescription,
          status: productData.status ?? "APPROVED",
        });
      } catch (e) {
        const isProductCodeCollision =
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002" &&
          (e.meta?.target as string[] | undefined)?.includes("productCode");
        if (isProductCodeCollision) {
          if (attempt < PRODUCT_CODE_RETRY_ATTEMPTS) continue;
          break;
        }
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new ConflictException("A product with this name already exists");
        }
        throw e;
      }
    }
    throw new ConflictException("Could not generate a unique product ID — please try again");
  }

  async update(id: string, merchantId: string, dto: UpdateProductDto) {
    const product = await this.assertOwnedProduct(id, merchantId);

    // Validate compareAtPrice vs basePrice for partial updates
    const effectiveBase = dto.basePrice ?? Number(product.basePrice);
    const effectiveCompare = dto.compareAtPrice !== undefined ? dto.compareAtPrice : (product.compareAtPrice ? Number(product.compareAtPrice) : undefined);
    if (effectiveCompare !== undefined && effectiveCompare !== null && effectiveCompare <= effectiveBase) {
      throw new BadRequestException("compareAtPrice must be greater than basePrice");
    }

    // A suspension is an admin enforcement action — a merchant can still edit
    // other fields, but can't self-reactivate by just setting status back
    // ("SUSPENDED" isn't in UpdateProductDto's allowed values, so any status
    // change attempted here is necessarily an attempt to move off it).
    if (product.status === "SUSPENDED" && dto.status) {
      throw new BadRequestException(
        "This product is suspended by an admin — contact support to have it reactivated.",
      );
    }

    const { tagIds, status, dealEndsAt, ...updateData } = dto;

    // Status transition rules:
    // - REJECTED → any merchant action auto-promotes to PENDING_APPROVAL + clears rejection
    // - Otherwise respect the merchant's explicit status choice (DRAFT / APPROVED / ARCHIVED)
    const wasRejected = product.status === "REJECTED";
    const resolvedStatus = wasRejected ? "PENDING_APPROVAL" : status;

    const updated = await this.repo.update(id, {
      ...updateData,
      ...(dealEndsAt !== undefined ? { dealEndsAt: dealEndsAt ? new Date(dealEndsAt) : null } : {}),
      ...(resolvedStatus ? { status: resolvedStatus, ...(wasRejected ? { rejectionReason: null } : {}) } : {}),
    });

    if (tagIds !== undefined) {
      await this.repo.syncTags(id, tagIds);
    }
    return updated;
  }

  async remove(id: string, merchantId: string): Promise<void> {
    await this.assertOwnedProduct(id, merchantId);
    await this.repo.softDelete(id);
  }

  // --- Admin ---

  async listForAdmin(query: AdminProductQueryDto) {
    const { items, totalItems } = await this.repo.findAdminList({
      status: query.status,
      merchantId: query.merchantId,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { data: items, meta: paginate(query.page, query.limit, totalItems) };
  }

  async findAdminProduct(id: string) {
    const product = await this.repo.findByIdWithDetail(id);
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async approve(id: string, adminId: string) {
    const product = await this.findAdminProduct(id);
    if (product.status !== "PENDING_APPROVAL") {
      throw new BadRequestException("Only a product pending approval can be approved");
    }
    return this.repo.setApprovalStatus(id, { status: "APPROVED", approvedById: adminId, approvedAt: new Date() });
  }

  async reject(id: string, adminId: string, rejectionReason: string) {
    const product = await this.findAdminProduct(id);
    if (product.status !== "PENDING_APPROVAL") {
      throw new BadRequestException("Only a product pending approval can be rejected");
    }
    return this.repo.setApprovalStatus(id, { status: "REJECTED", approvedById: adminId, rejectionReason });
  }

  async setFeatured(id: string, isFeatured: boolean) {
    await this.findAdminProduct(id);
    return this.repo.update(id, { isFeatured });
  }

  /** Admin-only visibility levers, available any time after creation (products
   *  are live by default now — see create()). Unlike approve()/reject(), these
   *  work from any current status, not just PENDING_APPROVAL. */
  async suspend(id: string) {
    await this.findAdminProduct(id);
    return this.repo.setStatus(id, "SUSPENDED");
  }

  async activate(id: string, adminId: string) {
    await this.findAdminProduct(id);
    return this.repo.setApprovalStatus(id, { status: "APPROVED", approvedById: adminId, approvedAt: new Date() });
  }

  async archive(id: string) {
    await this.findAdminProduct(id);
    return this.repo.setStatus(id, "ARCHIVED");
  }

  // --- Variants ---

  async addVariant(productId: string, merchantId: string, dto: CreateVariantDto) {
    await this.assertOwnedProduct(productId, merchantId);
    const existing = await this.repo.findVariantBySku(dto.sku);
    if (existing) throw new ConflictException("SKU is already in use");
    return this.repo.createVariant({ productId, ...dto, attributeValueIds: dto.attributeValueIds ?? [] });
  }

  async updateVariant(productId: string, variantId: string, merchantId: string, dto: UpdateVariantDto) {
    await this.assertOwnedVariant(productId, variantId, merchantId);
    if (dto.sku) {
      const existing = await this.repo.findVariantBySku(dto.sku);
      if (existing && existing.id !== variantId) throw new ConflictException("SKU is already in use");
    }
    return this.repo.updateVariant(variantId, dto);
  }

  async removeVariant(productId: string, variantId: string, merchantId: string): Promise<void> {
    await this.assertOwnedVariant(productId, variantId, merchantId);
    await this.repo.softDeleteVariant(variantId);
  }

  async updateInventory(productId: string, variantId: string, merchantId: string, dto: UpdateInventoryDto) {
    await this.assertOwnedVariant(productId, variantId, merchantId);
    return this.repo.upsertInventory(variantId, dto);
  }

  // --- Images ---

  async listImages(productId: string, merchantId: string) {
    await this.assertOwnedProduct(productId, merchantId);
    return this.repo.listImages(productId);
  }

  async addImage(productId: string, merchantId: string, dto: AddProductImageDto) {
    await this.assertOwnedProduct(productId, merchantId);
    if (dto.variantId) await this.assertOwnedVariant(productId, dto.variantId, merchantId);
    const count = await this.repo.countImages(productId);
    if (count >= 5) throw new BadRequestException("Maximum 5 images allowed per product");
    return this.repo.addImage({
      productId,
      mediaId: dto.mediaId,
      variantId: dto.variantId,
      isPrimary: count === 0 || (dto.isPrimary ?? false),
      sortOrder: count,
    });
  }

  async removeImage(productId: string, imageId: string, merchantId: string): Promise<void> {
    await this.assertOwnedProduct(productId, merchantId);
    const image = await this.repo.findImageById(imageId);
    if (!image || image.productId !== productId) throw new NotFoundException("Image not found");
    const count = await this.repo.countImages(productId);
    if (count <= 1) throw new BadRequestException("At least one image is required");
    await this.repo.removeImage(imageId);
    if (image.isPrimary) {
      const remaining = await this.repo.listImages(productId);
      const first = remaining[0];
      if (first) await this.repo.setPrimary(productId, first.id);
    }
  }

  async setPrimaryImage(productId: string, imageId: string, merchantId: string) {
    await this.assertOwnedProduct(productId, merchantId);
    const image = await this.repo.findImageById(imageId);
    if (!image || image.productId !== productId) throw new NotFoundException("Image not found");
    await this.repo.setPrimary(productId, imageId);
  }

  async reorderImages(productId: string, merchantId: string, items: { id: string; sortOrder: number }[]) {
    await this.assertOwnedProduct(productId, merchantId);
    await this.repo.reorderImages(items);
  }

  // --- Admin Images ---

  async listImagesAdmin(productId: string) {
    await this.findAdminProduct(productId);
    return this.repo.listImages(productId);
  }

  async addImageAdmin(productId: string, dto: AddProductImageDto) {
    await this.findAdminProduct(productId);
    const count = await this.repo.countImages(productId);
    if (count >= 5) throw new BadRequestException("Maximum 5 images allowed per product");
    return this.repo.addImage({
      productId,
      mediaId: dto.mediaId,
      variantId: dto.variantId,
      isPrimary: count === 0 || (dto.isPrimary ?? false),
      sortOrder: count,
    });
  }

  async removeImageAdmin(productId: string, imageId: string): Promise<void> {
    await this.findAdminProduct(productId);
    const image = await this.repo.findImageById(imageId);
    if (!image || image.productId !== productId) throw new NotFoundException("Image not found");
    const count = await this.repo.countImages(productId);
    if (count <= 1) throw new BadRequestException("At least one image is required");
    await this.repo.removeImage(imageId);
    if (image.isPrimary) {
      const remaining = await this.repo.listImages(productId);
      const first = remaining[0];
      if (first) await this.repo.setPrimary(productId, first.id);
    }
  }

  async setPrimaryImageAdmin(productId: string, imageId: string) {
    await this.findAdminProduct(productId);
    const image = await this.repo.findImageById(imageId);
    if (!image || image.productId !== productId) throw new NotFoundException("Image not found");
    await this.repo.setPrimary(productId, imageId);
  }

  async reorderImagesAdmin(productId: string, items: { id: string; sortOrder: number }[]) {
    await this.findAdminProduct(productId);
    await this.repo.reorderImages(items);
  }

  // --- Internal helpers ---

  private async assertOwnedProduct(id: string, merchantId: string, withDetail = false) {
    const product = withDetail ? await this.repo.findByIdWithDetail(id) : await this.repo.findById(id);
    if (!product || product.merchantId !== merchantId) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  private async assertOwnedVariant(productId: string, variantId: string, merchantId: string) {
    await this.assertOwnedProduct(productId, merchantId);
    const variant = await this.repo.findVariantById(variantId);
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException("Variant not found");
    }
    return variant;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || "product";
    let slug = base;
    let suffix = 2;
    while (await this.repo.findBySlug(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }
}
