import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { slugify } from "../common/utils/slugify.util";
import { AttributesRepository } from "./attributes.repository";
import type { CreateAttributeDto, CreateAttributeValueDto } from "./dto/create-attribute.dto";
import type { UpdateAttributeDto } from "./dto/update-attribute.dto";

@Injectable()
export class AttributesService {
  constructor(private readonly repo: AttributesRepository) {}

  list() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const attribute = await this.repo.findById(id);
    if (!attribute) throw new NotFoundException("Attribute not found");
    return attribute;
  }

  async create(dto: CreateAttributeDto) {
    const slug = await this.generateUniqueSlug(dto.name);
    return this.repo.create({
      name: dto.name,
      slug,
      type: dto.type,
      values: dto.values.map((v, index) => ({
        value: v.value,
        colorHex: v.colorHex,
        sortOrder: v.sortOrder ?? index,
      })),
    });
  }

  async update(id: string, dto: UpdateAttributeDto) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    const usage = await this.repo.countProductUsage(id);
    if (usage > 0) {
      throw new ConflictException(`Cannot delete an attribute used by ${usage} product(s)`);
    }
    await this.repo.delete(id);
  }

  async addValue(attributeId: string, dto: CreateAttributeValueDto) {
    const attribute = await this.findById(attributeId);
    return this.repo.addValue(attributeId, {
      value: dto.value,
      colorHex: dto.colorHex,
      sortOrder: dto.sortOrder ?? attribute.values.length,
    });
  }

  async removeValue(attributeId: string, valueId: string): Promise<void> {
    const value = await this.repo.findValueById(valueId);
    if (!value || value.attributeId !== attributeId) {
      throw new NotFoundException("Attribute value not found");
    }
    const usage = await this.repo.countValueUsage(valueId);
    if (usage > 0) {
      throw new ConflictException(`Cannot delete a value used by ${usage} product variant(s)`);
    }
    await this.repo.deleteValue(valueId);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || "attribute";
    let slug = base;
    let suffix = 2;
    while (await this.repo.findBySlug(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }
}
