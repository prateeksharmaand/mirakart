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

  async codOrderStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [pendingConfirmationCount, todaysCodOrders, outstanding] = await Promise.all([
      this.prisma.order.count({ where: { deletedAt: null, status: "PENDING_CONFIRMATION" } }),
      this.prisma.order.count({
        where: { deletedAt: null, payment: { method: "COD" }, createdAt: { gte: startOfToday } },
      }),
      this.prisma.order.aggregate({
        where: { deletedAt: null, payment: { method: "COD", status: "UNPAID" } },
        _sum: { total: true },
      }),
    ]);
    return {
      pendingConfirmationCount,
      todaysCodOrders,
      outstandingCodAmount: Number(outstanding._sum.total ?? 0),
    };
  }

  async adminOrderStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const base = { deletedAt: null } as const;

    const [totalOrders, todaysOrders, pendingOrders, processingOrders, deliveredOrders, cancelledOrders, codOrders, onlineOrders] =
      await Promise.all([
        this.prisma.order.count({ where: base }),
        this.prisma.order.count({ where: { ...base, createdAt: { gte: startOfToday } } }),
        this.prisma.order.count({ where: { ...base, status: "CONFIRMED" } }),
        this.prisma.order.count({
          where: { ...base, status: { in: ["ACCEPTED", "PROCESSING", "PACKED", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY"] } },
        }),
        this.prisma.order.count({ where: { ...base, status: "DELIVERED" } }),
        this.prisma.order.count({ where: { ...base, status: "CANCELLED" } }),
        this.prisma.order.count({ where: { ...base, payment: { method: "COD" } } }),
        this.prisma.order.count({ where: { ...base, payment: { method: { not: "COD" } } } }),
      ]);

    return { totalOrders, todaysOrders, pendingOrders, processingOrders, deliveredOrders, cancelledOrders, codOrders, onlineOrders };
  }

  async merchantOrderStatusSummary(merchantId: string) {
    // newOrders = items at CONFIRMED, i.e. handed to the merchant and
    // awaiting Accept — the "New Order" step at the top of the fulfillment
    // ladder in order-workflow.util.ts.
    const [newOrders, processing, packed, shipped, delivered, completed, cancelled] = await Promise.all([
      this.prisma.orderItem.count({ where: { merchantId, status: "CONFIRMED" } }),
      this.prisma.orderItem.count({ where: { merchantId, status: "PROCESSING" } }),
      this.prisma.orderItem.count({ where: { merchantId, status: "PACKED" } }),
      this.prisma.orderItem.count({ where: { merchantId, status: "SHIPPED" } }),
      this.prisma.orderItem.count({ where: { merchantId, status: "DELIVERED" } }),
      this.prisma.orderItem.count({ where: { merchantId, status: "COMPLETED" } }),
      this.prisma.orderItem.count({ where: { merchantId, status: "CANCELLED" } }),
    ]);
    return { newOrders, processing, packed, shipped, delivered, completed, cancelled };
  }

  async merchantStockSummary(merchantId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { deletedAt: null, product: { merchantId, deletedAt: null } },
      select: { productId: true, inventory: { select: { quantity: true, lowStockThreshold: true } } },
    });
    // Column-to-column comparison (quantity <= lowStockThreshold) isn't
    // expressible as a Prisma where-clause, so this is aggregated in-process.
    const byProduct = new Map<string, { quantity: number; lowStockThreshold: number }[]>();
    for (const v of variants) {
      if (!v.inventory) continue;
      const list = byProduct.get(v.productId) ?? [];
      list.push(v.inventory);
      byProduct.set(v.productId, list);
    }
    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const inventories of byProduct.values()) {
      const stockCount = inventories.reduce((sum, i) => sum + i.quantity, 0);
      if (stockCount === 0) {
        outOfStockCount++;
      } else if (inventories.some((i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold)) {
        lowStockCount++;
      }
    }
    return { lowStockCount, outOfStockCount };
  }
}
