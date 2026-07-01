import { Injectable, NotFoundException } from "@nestjs/common";
import type { BannerPosition } from "@prisma/client";
import { BannersRepository } from "./banners.repository";
import type { CreateBannerDto } from "./dto/create-banner.dto";
import type { UpdateBannerDto } from "./dto/update-banner.dto";

@Injectable()
export class BannersService {
  constructor(private readonly repo: BannersRepository) {}

  listActive(position: BannerPosition) {
    return this.repo.findActiveForPosition(position);
  }

  listForAdmin() {
    return this.repo.findAllForAdmin();
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
