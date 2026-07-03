import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { slugify } from "../common/utils/slugify.util";
import { TagsRepository } from "./tags.repository";
import type { CreateTagDto } from "./dto/create-tag.dto";
import type { TagQueryDto } from "./dto/tag-query.dto";
import type { UpdateTagDto } from "./dto/update-tag.dto";

function paginate(page: number, limit: number, totalItems: number) {
  return { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) };
}

@Injectable()
export class TagsService {
  constructor(private readonly repo: TagsRepository) {}

  listActive() {
    return this.repo.findAllActive();
  }

  async listAdmin(query: TagQueryDto) {
    const { items, totalItems } = await this.repo.findAdminList({
      search: query.search,
      isActive: query.isActive,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { data: items, meta: paginate(query.page, query.limit, totalItems) };
  }

  async findById(id: string) {
    const tag = await this.repo.findById(id);
    if (!tag) throw new NotFoundException("Tag not found");
    return tag;
  }

  async create(dto: CreateTagDto) {
    const slug = await this.generateUniqueSlug(dto.name);
    return this.repo.create({
      name: dto.name,
      slug,
      description: dto.description,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  async update(id: string, dto: UpdateTagDto) {
    await this.findById(id);
    const data: Parameters<TagsRepository["update"]>[1] = {
      description: dto.description,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    };
    if (dto.name) {
      data.name = dto.name;
      data.slug = await this.generateUniqueSlug(dto.name, id);
    }
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.softDelete(id);
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name) || "tag";
    let slug = base;
    let suffix = 2;
    while (true) {
      const existing = await this.repo.findBySlug(slug);
      if (!existing || existing.id === excludeId) break;
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }
}
