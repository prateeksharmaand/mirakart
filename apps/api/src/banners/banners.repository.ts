import { Injectable } from "@nestjs/common";
import type { BannerPosition, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const BANNER_SORT_FIELDS = ["sortOrder", "createdAt", "title", "position"] as const;

@Injectable()
export class BannersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveForPosition(position: BannerPosition) {
    const now = new Date();
    const where: Prisma.BannerWhereInput = {
      position,
      isActive: true,
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    };
    return this.prisma.banner.findMany({ where, include: { media: true }, orderBy: { sortOrder: "asc" } });
  }

  async findAdminList(filter: {
    search?: string;
    position?: BannerPosition;
    isActive?: boolean;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where: Prisma.BannerWhereInput = {
      ...(filter.position ? { position: filter.position } : {}),
      ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
      ...(filter.search ? { title: { contains: filter.search, mode: "insensitive" as const } } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.banner.findMany({
        where,
        include: { media: true },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, BANNER_SORT_FIELDS, "sortOrder"),
      }),
      this.prisma.banner.count({ where }),
    ]);
    return { items, totalItems };
  }

  findById(id: string) {
    return this.prisma.banner.findUnique({ where: { id }, include: { media: true } });
  }

  create(data: {
    title: string;
    mediaId: string;
    linkUrl?: string;
    position: BannerPosition;
    sortOrder?: number;
    startAt?: Date;
    endAt?: Date;
  }) {
    return this.prisma.banner.create({ data });
  }

  update(
    id: string,
    data: Partial<{
      title: string;
      mediaId: string;
      linkUrl: string | null;
      position: BannerPosition;
      sortOrder: number;
      isActive: boolean;
      startAt: Date | null;
      endAt: Date | null;
    }>,
  ) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.banner.delete({ where: { id } });
  }
}
