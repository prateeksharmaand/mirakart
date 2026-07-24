import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const productListSelect = {
  id: true,
  name: true,
  slug: true,
  productCode: true,
  basePrice: true,
  compareAtPrice: true,
  isFeatured: true,
  images: {
    where: { isPrimary: true },
    take: 1,
    include: { media: true },
  },
  brand: { select: { id: true, name: true, slug: true } },
  variants: { where: { deletedAt: null }, select: { id: true, inventory: { select: { quantity: true } } } },
};

@Injectable()
export class WishlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Only surfaces items whose product is still ACTIVE — a suspended/archived
  // product shouldn't show up in a customer's wishlist as if still
  // purchasable. The wishlist row itself is untouched, so it reappears
  // automatically if the product is reactivated.
  async findByCustomer(customerId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { customerId, product: { status: "APPROVED", deletedAt: null } },
      orderBy: { createdAt: "desc" },
      include: { product: { select: productListSelect } },
    });

    const reviewStats =
      items.length > 0
        ? await this.prisma.review.groupBy({
            by: ["productId"],
            where: { productId: { in: items.map((item) => item.productId) }, isApproved: true, deletedAt: null },
            _avg: { rating: true },
            _count: { id: true },
          })
        : [];
    const statsByProductId = new Map(
      reviewStats.map((stat) => [
        stat.productId,
        { averageRating: stat._avg.rating ? Number(stat._avg.rating.toFixed(1)) : 0, reviewCount: stat._count.id },
      ]),
    );

    return items.map(({ product: { variants, ...product }, ...item }) => ({
      ...item,
      product: {
        ...product,
        ...(statsByProductId.get(product.id) ?? { averageRating: 0, reviewCount: 0 }),
        availableCount: variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0),
        variantCount: variants.length,
        singleVariantId: variants.length === 1 ? (variants[0]?.id ?? null) : null,
      },
    }));
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
    return this.prisma.wishlistItem.count({
      where: { customerId, product: { status: "APPROVED", deletedAt: null } },
    });
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
