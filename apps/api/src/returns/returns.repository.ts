import { Injectable } from "@nestjs/common";
import type { ActorType, Prisma, ReturnResolutionType, ReturnStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

const RETURN_SORT_FIELDS = ["createdAt", "returnNumber", "status"] as const;

const variantAttributeValuesInclude = {
  attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
};

const returnDetailInclude = {
  images: true,
  statusHistory: { orderBy: { changedAt: "asc" as const } },
  reason: true,
  orderItem: true,
  replacementVariant: { include: variantAttributeValuesInclude },
  order: { select: { id: true, orderNumber: true } },
  merchant: { select: { id: true, storeName: true } },
  customer: { select: { id: true, firstName: true, lastName: true } },
};

export class InsufficientReplacementStockError extends Error {
  constructor(public readonly variantId: string) {
    super(`Insufficient stock for replacement variant ${variantId}`);
  }
}

@Injectable()
export class ReturnsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveReasons() {
    return this.prisma.returnReason.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  }

  findOrderItemForReturn(orderItemId: string, customerId: string) {
    return this.prisma.orderItem.findFirst({
      where: { id: orderItemId, order: { customerId } },
      include: { order: true, variant: { select: { id: true, productId: true } } },
    });
  }

  findVariantById(id: string) {
    return this.prisma.productVariant.findFirst({ where: { id, deletedAt: null } });
  }

  findReplacementVariants(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId, deletedAt: null },
      include: { inventory: true, ...variantAttributeValuesInclude },
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
    resolutionType: ReturnResolutionType;
    replacementVariantId?: string;
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
          resolutionType: data.resolutionType,
          replacementVariantId: data.replacementVariantId,
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

  async findMerchantReturns(filter: {
    merchantId: string;
    status?: ReturnStatus;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where: Prisma.ReturnWhereInput = {
      merchantId: filter.merchantId,
      ...(filter.status ? { status: filter.status } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.return.findMany({
        where,
        include: {
          reason: true,
          images: true,
          order: { select: { id: true, orderNumber: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, RETURN_SORT_FIELDS, "createdAt"),
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
        include: {
          reason: true,
          images: true,
          order: { select: { id: true, orderNumber: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
          merchant: { select: { id: true, storeName: true } },
        },
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

  /** Merchant approval → AWAITING_SHIPMENT. When `replacementVariantId` is
   *  set (a REPLACEMENT request), atomically decrements that variant's
   *  stock first — guarded the same way checkout's stock decrement is, so
   *  two concurrent approvals can't oversell a low-stock replacement. */
  async approveReturn(id: string, merchantId: string, replacementVariantId: string | null, quantity: number) {
    return this.prisma.$transaction(async (tx) => {
      if (replacementVariantId) {
        const result = await tx.inventory.updateMany({
          where: { variantId: replacementVariantId, quantity: { gte: quantity } },
          data: { quantity: { decrement: quantity } },
        });
        if (result.count === 0) {
          throw new InsufficientReplacementStockError(replacementVariantId);
        }
      }
      const updated = await tx.return.update({
        where: { id },
        data: { status: "AWAITING_SHIPMENT" },
        include: returnDetailInclude,
      });
      await tx.returnStatusHistory.create({
        data: { returnId: id, status: "AWAITING_SHIPMENT", changedByType: "MERCHANT", changedById: merchantId },
      });
      return updated;
    });
  }

  /** Merchant confirms the returned item arrived → ITEM_RECEIVED. Restocks
   *  the *originally purchased* variant — applies to both REFUND and
   *  REPLACEMENT requests, since the physical item comes back either way
   *  (this is also the fix for refund-returns never having restocked
   *  anything at all before this feature). */
  async markItemReceived(id: string, merchantId: string, originalVariantId: string, quantity: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.inventory.updateMany({
        where: { variantId: originalVariantId },
        data: { quantity: { increment: quantity } },
      });
      const updated = await tx.return.update({
        where: { id },
        data: { status: "ITEM_RECEIVED" },
        include: returnDetailInclude,
      });
      await tx.returnStatusHistory.create({
        data: { returnId: id, status: "ITEM_RECEIVED", changedByType: "MERCHANT", changedById: merchantId },
      });
      return updated;
    });
  }
}
