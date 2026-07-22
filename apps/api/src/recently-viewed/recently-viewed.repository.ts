import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  basePrice: true,
  compareAtPrice: true,
  isFeatured: true,
  images: {
    where: { isPrimary: true },
    take: 1,
    include: { media: true },
  },
  brand: { select: { id: true, name: true, slug: true } },
};

@Injectable()
export class RecentlyViewedRepository {
  constructor(private readonly prisma: PrismaService) {}

  async track(customerId: string, productId: string): Promise<void> {
    // Upsert: refresh viewedAt if already exists
    await this.prisma.recentlyViewed.upsert({
      where: { customerId_productId: { customerId, productId } },
      create: {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        customerId,
        productId,
      },
      update: { viewedAt: new Date() },
    });

    // Keep only the last 20 items per customer
    const items = await this.prisma.recentlyViewed.findMany({
      where: { customerId },
      orderBy: { viewedAt: "desc" },
      skip: 20,
      select: { id: true },
    });
    if (items.length > 0) {
      await this.prisma.recentlyViewed.deleteMany({
        where: { id: { in: items.map((i) => i.id) } },
      });
    }
  }

  // Only surfaces items whose product is still ACTIVE — same reasoning as
  // WishlistRepository.findByCustomer.
  findByCustomer(customerId: string, limit = 20) {
    return this.prisma.recentlyViewed.findMany({
      where: { customerId, product: { status: "APPROVED", deletedAt: null } },
      orderBy: { viewedAt: "desc" },
      take: limit,
      include: { product: { select: productSelect } },
    });
  }

  clear(customerId: string) {
    return this.prisma.recentlyViewed.deleteMany({ where: { customerId } });
  }
}
