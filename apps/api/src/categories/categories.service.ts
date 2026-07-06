import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { slugify } from "../common/utils/slugify.util";
import { CategoriesRepository } from "./categories.repository";
import type { CreateCategoryDto } from "./dto/create-category.dto";
import type { UpdateCategoryDto } from "./dto/update-category.dto";

type CategoryWithMedia = Prisma.CategoryGetPayload<{ include: { iconMedia: true; bannerMedia: true } }>;

export interface CategoryNode extends CategoryWithMedia {
  children: CategoryNode[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  async list(flat: boolean): Promise<CategoryWithMedia[] | CategoryNode[]> {
    const categories = await this.repo.findAllActive();
    return flat ? categories : this.buildTree(categories);
  }

  listForAdmin() {
    return this.repo.findAllForAdmin();
  }

  async findBySlug(slug: string): Promise<CategoryWithMedia> {
    const category = await this.repo.findBySlug(slug);
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  async findById(id: string): Promise<CategoryWithMedia> {
    const category = await this.repo.findById(id);
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) await this.findById(dto.parentId);
    const slug = await this.generateUniqueSlug(dto.name);
    return this.repo.create({ ...dto, slug });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);
    if (dto.parentId) {
      if (dto.parentId === id) throw new ConflictException("A category cannot be its own parent");
      await this.findById(dto.parentId);
    }
    return this.repo.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    const [childCount, productCount] = await Promise.all([
      this.repo.countChildren(id),
      this.repo.countActiveProducts(id),
    ]);
    if (childCount > 0) {
      throw new ConflictException("Cannot delete a category that has subcategories");
    }
    if (productCount > 0) {
      throw new ConflictException(`Cannot delete a category with ${productCount} active product(s)`);
    }
    await this.repo.softDelete(id);
  }

  // ── Category-Attribute assignment ──────────────────────────────────────────

  getCategoryAttributes(categoryId: string) {
    return this.repo.findAttributesByCategoryId(categoryId);
  }

  async getCategoryAttributesPublic(categorySlug: string) {
    const category = await this.repo.findBySlug(categorySlug);
    if (!category) throw new NotFoundException("Category not found");
    return this.repo.findAttributesByCategoryId(category.id);
  }

  async getCategoryAttributesById(categoryId: string) {
    const category = await this.repo.findById(categoryId);
    if (!category) throw new NotFoundException("Category not found");
    return this.repo.findAttributesByCategoryId(categoryId);
  }

  async assignAttribute(categoryId: string, attributeId: string, sortOrder = 0, isRequired = false) {
    await this.findById(categoryId);
    const existing = await this.repo.findCategoryAttribute(categoryId, attributeId);
    if (existing) {
      return this.repo.updateCategoryAttribute(existing.id, { sortOrder, isRequired });
    }
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return this.repo.assignAttribute({ id, categoryId, attributeId, sortOrder, isRequired });
  }

  async unassignAttribute(categoryId: string, attributeId: string) {
    await this.findById(categoryId);
    const existing = await this.repo.findCategoryAttribute(categoryId, attributeId);
    if (!existing) throw new NotFoundException("Attribute not assigned to this category");
    await this.repo.unassignAttribute(categoryId, attributeId);
  }

  private buildTree(categories: CategoryWithMedia[]): CategoryNode[] {
    const byId = new Map<string, CategoryNode>(categories.map((c) => [c.id, { ...c, children: [] }]));
    const roots: CategoryNode[] = [];

    for (const category of byId.values()) {
      if (category.parentId && byId.has(category.parentId)) {
        byId.get(category.parentId)!.children.push(category);
      } else {
        roots.push(category);
      }
    }
    return roots;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || "category";
    let slug = base;
    let suffix = 2;
    while (await this.repo.findBySlug(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }
}
