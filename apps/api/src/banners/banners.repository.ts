import { Injectable } from "@nestjs/common";
import type { BannerPosition, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

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

  findAllForAdmin() {
    return this.prisma.banner.findMany({
      include: { media: true },
      orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
    });
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
