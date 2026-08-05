import { Injectable, NotFoundException } from "@nestjs/common";
import type { BannerPosition } from "@prisma/client";
import { BannersRepository } from "./banners.repository";
import type { BannerQueryDto } from "./dto/banner-query.dto";
import type { CreateBannerDto } from "./dto/create-banner.dto";
import type { UpdateBannerDto } from "./dto/update-banner.dto";

function paginate(page: number, limit: number, totalItems: number) {
  return { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) };
}

@Injectable()
export class BannersService {
  constructor(private readonly repo: BannersRepository) {}

  listActive(position: BannerPosition) {
    return this.repo.findActiveForPosition(position);
  }

  async listForAdmin(query: BannerQueryDto) {
    const { items, totalItems } = await this.repo.findAdminList({
      search: query.search,
      position: query.position,
      isActive: query.isActive,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { data: items, meta: paginate(query.page, query.limit, totalItems) };
  }

  async findById(id: string) {
    const banner = await this.repo.findById(id);
    if (!banner) throw new NotFoundException("Banner not found");
    return banner;
  }

  create(dto: CreateBannerDto) {
    return this.repo.create({
      title: dto.title,
      mediaId: dto.mediaId,
      linkUrl: dto.linkUrl,
      position: dto.position,
      sortOrder: dto.sortOrder,
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
    });
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.findById(id);
    return this.repo.update(id, {
      ...dto,
      startAt: dto.startAt === undefined ? undefined : dto.startAt === null ? null : new Date(dto.startAt),
      endAt: dto.endAt === undefined ? undefined : dto.endAt === null ? null : new Date(dto.endAt),
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.delete(id);
  }
}
