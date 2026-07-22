import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { slugify } from "../common/utils/slugify.util";
import { BrandsRepository } from "./brands.repository";
import type { CreateBrandDto } from "./dto/create-brand.dto";
import type { UpdateBrandDto } from "./dto/update-brand.dto";

@Injectable()
export class BrandsService {
  constructor(private readonly repo: BrandsRepository) {}

  list() {
    return this.repo.findAllActive();
  }

  listForAdmin() {
    return this.repo.findAllForAdmin();
  }

  async findBySlug(slug: string) {
    const brand = await this.repo.findBySlug(slug);
    if (!brand) throw new NotFoundException("Brand not found");
    return brand;
  }

  async findById(id: string) {
    const brand = await this.repo.findById(id);
    if (!brand) throw new NotFoundException("Brand not found");
    return brand;
  }

  async create(dto: CreateBrandDto) {
    const slug = await this.generateUniqueSlug(dto.name);
    const code = await this.resolveUniqueCode(dto.code, dto.name);
    return this.repo.create({ ...dto, slug, code });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.findById(id);
    if (dto.code) {
      const existing = await this.repo.findByCode(dto.code);
      if (existing && existing.id !== id) throw new ConflictException("This brand code is already in use");
    }
    return this.repo.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    const productCount = await this.repo.countActiveProducts(id);
    if (productCount > 0) {
      throw new ConflictException(`Cannot delete a brand with ${productCount} active product(s)`);
    }
    await this.repo.softDelete(id);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || "brand";
    let slug = base;
    let suffix = 2;
    while (await this.repo.findBySlug(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }

  /** Product IDs use the brand code as their prefix, so every brand needs
   *  one — auto-derived from the name (uppercase, alphanumeric only,
   *  truncated to 8 chars) when the admin doesn't set one explicitly. */
  private async resolveUniqueCode(explicitCode: string | undefined, name: string): Promise<string> {
    if (explicitCode) {
      const existing = await this.repo.findByCode(explicitCode);
      if (existing) throw new ConflictException("This brand code is already in use");
      return explicitCode;
    }
    const base = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "BRAND";
    let code = base;
    let suffix = 2;
    while (await this.repo.findByCode(code)) {
      code = `${base}${suffix}`;
      suffix += 1;
    }
    return code;
  }
}
