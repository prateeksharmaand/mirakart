import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const productListSelect = {
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
export class WishlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCustomer(customerId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: { product: { select: productListSelect } },
    });
  }

  findItem(customerId: string, productId: string) {
    return this.prisma.wishlistItem.findUnique({
      where: { customerId_productId: { customerId, productId } },
    });
  }

  add(customerId: string, productId: string) {
    return this.prisma.wishlistItem.create({
      data: { id: this.generateId(), customerId, productId },
      include: { product: { select: productListSelect } },
    });
  }

  remove(customerId: string, productId: string) {
    return this.prisma.wishlistItem.delete({
      where: { customerId_productId: { customerId, productId } },
    });
  }

  countByCustomer(customerId: string): Promise<number> {
    return this.prisma.wishlistItem.count({ where: { customerId } });
  }

  getProductIds(customerId: string): Promise<{ productId: string }[]> {
    return this.prisma.wishlistItem.findMany({
      where: { customerId },
      select: { productId: true },
    });
  }

  private generateId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
