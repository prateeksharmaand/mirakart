import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface DateRange {
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async adminSalesSummary(range: DateRange) {
    const where = {
      deletedAt: null,
      status: { not: "CANCELLED" as const },
      createdAt: { gte: range.dateFrom, lte: range.dateTo },
    };
    const [totalOrders, revenue, totalReturns] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({ where, _sum: { total: true } }),
      this.prisma.return.count({ where: { createdAt: { gte: range.dateFrom, lte: range.dateTo } } }),
    ]);
    return { totalOrders, totalRevenue: Number(revenue._sum.total ?? 0), totalReturns };
  }

  async merchantSalesSummary(merchantId: string, range: DateRange) {
    const itemWhere = {
      merchantId,
      status: { not: "CANCELLED" as const },
      order: { deletedAt: null, createdAt: { gte: range.dateFrom, lte: range.dateTo } },
    };
    const [distinctOrders, revenue, totalReturns] = await Promise.all([
      this.prisma.orderItem.findMany({ where: itemWhere, distinct: ["orderId"], select: { orderId: true } }),
      this.prisma.orderItem.aggregate({ where: itemWhere, _sum: { totalPrice: true } }),
      this.prisma.return.count({
        where: { merchantId, createdAt: { gte: range.dateFrom, lte: range.dateTo } },
      }),
    ]);
    return {
      totalOrders: distinctOrders.length,
      totalRevenue: Number(revenue._sum.totalPrice ?? 0),
      totalReturns,
    };
  }

  async topProducts(merchantId: string | undefined, range: DateRange, limit: number) {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        ...(merchantId ? { merchantId } : {}),
        status: { not: "CANCELLED" },
        order: { deletedAt: null, createdAt: { gte: range.dateFrom, lte: range.dateTo } },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });
    if (grouped.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: grouped.map((g) => g.productId) } },
      select: { id: true, name: true, slug: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    return grouped.map((g) => ({
      product: productById.get(g.productId) ?? null,
      unitsSold: g._sum.quantity ?? 0,
      revenue: Number(g._sum.totalPrice ?? 0),
    }));
  }
}
