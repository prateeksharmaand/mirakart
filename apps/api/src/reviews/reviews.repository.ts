import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const reviewInclude = {
  customer: { select: { id: true, firstName: true, lastName: true } },
};

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return Promise.all([
      this.prisma.review.findMany({
        where: { productId, isApproved: true, deletedAt: null },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { productId, isApproved: true, deletedAt: null },
      }),
    ]);
  }

  findByCustomer(customerId: string) {
    return this.prisma.review.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  findOne(productId: string, customerId: string) {
    return this.prisma.review.findUnique({
      where: { productId_customerId: { productId, customerId } },
    });
  }

  findById(id: string) {
    return this.prisma.review.findFirst({
      where: { id, deletedAt: null },
      include: reviewInclude,
    });
  }

  async getProductSummary(productId: string) {
    const result = await this.prisma.review.aggregate({
      where: { productId, isApproved: true, deletedAt: null },
      _avg: { rating: true },
      _count: { id: true },
    });
    return {
      averageRating: result._avg.rating ? Number(result._avg.rating.toFixed(1)) : 0,
      reviewCount: result._count.id,
    };
  }

  create(data: {
    id: string;
    productId: string;
    customerId: string;
    rating: number;
    title?: string;
    body?: string;
    verifiedPurchase: boolean;
  }) {
    return this.prisma.review.create({ data, include: reviewInclude });
  }

  update(id: string, data: Partial<{ rating: number; title: string; body: string }>) {
    return this.prisma.review.update({ where: { id }, data, include: reviewInclude });
  }

  softDelete(id: string) {
    return this.prisma.review.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  setApproved(id: string, isApproved: boolean) {
    return this.prisma.review.update({ where: { id }, data: { isApproved } });
  }

  hasVerifiedPurchase(customerId: string, productId: string): Promise<boolean> {
    return this.prisma.orderItem
      .findFirst({
        where: {
          order: { customerId, status: "DELIVERED" },
          productId,
        },
        select: { id: true },
      })
      .then((item) => !!item);
  }
}
