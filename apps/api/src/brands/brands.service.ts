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
    return this.repo.create({ ...dto, slug });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.findById(id);
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
}
