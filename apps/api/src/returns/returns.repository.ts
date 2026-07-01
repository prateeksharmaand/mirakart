import { Injectable } from "@nestjs/common";
import type { ActorType, Prisma, ReturnStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const RETURN_SORT_FIELDS = ["createdAt", "returnNumber", "status"] as const;

const returnDetailInclude = {
  images: true,
  statusHistory: { orderBy: { changedAt: "asc" as const } },
  reason: true,
  orderItem: true,
};

@Injectable()
export class ReturnsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveReasons() {
    return this.prisma.returnReason.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  }

  findOrderItemForReturn(orderItemId: string, customerId: string) {
    return this.prisma.orderItem.findFirst({
      where: { id: orderItemId, order: { customerId } },
      include: { order: true },
    });
  }

  countActiveReturnsForItem(orderItemId: string): Promise<number> {
    return this.prisma.return.count({
      where: { orderItemId, status: { notIn: ["REJECTED", "CANCELLED", "COMPLETED"] } },
    });
  }

  async create(data: {
    returnNumber: string;
    orderId: string;
    orderItemId: string;
    customerId: string;
    merchantId: string;
    reasonId: string;
    reasonDetail?: string;
    quantity: number;
    imageMediaIds: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.return.create({
        data: {
          returnNumber: data.returnNumber,
          orderId: data.orderId,
          orderItemId: data.orderItemId,
          customerId: data.customerId,
          merchantId: data.merchantId,
          reasonId: data.reasonId,
          reasonDetail: data.reasonDetail,
          quantity: data.quantity,
          images: { create: data.imageMediaIds.map((mediaId) => ({ mediaId })) },
          statusHistory: { create: { status: "REQUESTED", changedByType: "CUSTOMER", changedById: data.customerId } },
        },
        include: returnDetailInclude,
      });
      return created;
    });
  }

  async findCustomerReturns(customerId: string, page: number, limit: number) {
    const where: Prisma.ReturnWhereInput = { customerId };
    const [items, totalItems] = await Promise.all([
      this.prisma.return.findMany({
        where,
        include: { reason: true, images: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.return.count({ where }),
    ]);
    return { items, totalItems };
  }

  async findMerchantReturns(merchantId: string, page: number, limit: number) {
    const where: Prisma.ReturnWhereInput = { merchantId };
    const [items, totalItems] = await Promise.all([
      this.prisma.return.findMany({
        where,
        include: { reason: true, images: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.return.count({ where }),
    ]);
    return { items, totalItems };
  }

  async findAdminReturns(filter: {
    status?: ReturnStatus;
    merchantId?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where: Prisma.ReturnWhereInput = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.merchantId ? { merchantId: filter.merchantId } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.return.findMany({
        where,
        include: { reason: true, images: true },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, RETURN_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.return.count({ where }),
    ]);
    return { items, totalItems };
  }

  findById(id: string) {
    return this.prisma.return.findUnique({ where: { id }, include: returnDetailInclude });
  }

  async updateStatus(
    id: string,
    status: ReturnStatus,
    changedByType: ActorType,
    changedById: string | undefined,
    note?: string,
    refundAmount?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.return.update({
        where: { id },
        data: {
          status,
          ...(refundAmount !== undefined ? { refundAmount } : {}),
          ...(status === "COMPLETED" || status === "REJECTED" || status === "CANCELLED"
            ? { resolvedAt: new Date() }
            : {}),
        },
        include: returnDetailInclude,
      });
      await tx.returnStatusHistory.create({ data: { returnId: id, status, changedByType, changedById, note } });
      return updated;
    });
  }
}
