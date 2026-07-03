import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { slugify } from "../common/utils/slugify.util";
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

@Injectable()
export class ProductsService {
  constructor(private readonly repo: ProductsRepository) {}

  // --- Public ---

  async listPublic(query: ProductQueryDto) {
    const { items, totalItems } = await this.repo.findPublicList({
      categoryId: query.categoryId,
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

  async findPublicBySlug(slug: string) {
    const product = await this.repo.findPublicBySlug(slug);
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  // --- Merchant ---

  async listForMerchant(merchantId: string, query: MerchantProductQueryDto) {
    const { items, totalItems } = await this.repo.findMerchantList({
      merchantId,
      status: query.status,
      search: query.search,
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
    const product = await this.repo.create({
      merchantId,
      categoryId: productData.categoryId,
      brandId: productData.brandId,
      name: productData.name,
      slug,
      description: productData.description,
      basePrice: productData.basePrice,
      compareAtPrice: productData.compareAtPrice,
      sku: productData.sku,
      weight: productData.weight,
      metaTitle: productData.metaTitle,
      metaDescription: productData.metaDescription,
      status: productData.status ?? "DRAFT",
    });
    if (tagIds && tagIds.length > 0) {
      await this.repo.syncTags(product.id, tagIds);
    }
    return product;
  }

  async update(id: string, merchantId: string, dto: UpdateProductDto) {
    const product = await this.assertOwnedProduct(id, merchantId);
    const wasRejected = product.status === "REJECTED";
    const { tagIds, ...updateData } = dto;
    const updated = await this.repo.update(id, {
      ...updateData,
      ...(wasRejected ? { status: "PENDING_APPROVAL", rejectionReason: null } : {}),
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
