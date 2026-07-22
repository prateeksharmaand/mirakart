import { Injectable } from "@nestjs/common";
import type { ActorType, OrderItemStatus, OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";
import type { PaymentMethodFilter } from "./dto/admin-order-query.dto";

const ORDER_SORT_FIELDS = ["createdAt", "orderNumber", "status", "total"] as const;

export class InsufficientStockError extends Error {
  constructor(public readonly variantId: string) {
    super(`Insufficient stock for variant ${variantId}`);
  }
}

export interface CartLineForCheckout {
  variantId: string;
  merchantId: string;
  productId: string;
  productNameSnapshot: string;
  variantSnapshot: Prisma.InputJsonValue;
  quantity: number;
  unitPrice: number;
}

export interface LowStockAlert {
  merchantId: string;
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  quantity: number;
}

// Historical order items intentionally freeze name/price/attributes into
// productNameSnapshot/variantSnapshot at checkout time — but image, brand,
// merchant name, and Product ID are stable reference data (a product's
// picture or which store sold it doesn't retroactively change), so those
// are safe to live-join instead of also snapshotting.
const orderItemProductInclude = {
  product: {
    select: {
      productCode: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1, include: { media: true } },
    },
  },
  merchant: { select: { storeName: true } },
};

const orderDetailInclude = {
  items: { include: orderItemProductInclude },
  payment: true,
  statusHistory: { orderBy: { changedAt: "asc" as const } },
  shippingAddress: true,
  billingAddress: true,
  // Never actually included before — admin/merchant detail pages have long
  // had a `customer` field in their types with no query ever populating it.
  customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
};

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAddressForCustomer(addressId: string, customerId: string) {
    return this.prisma.address.findFirst({ where: { id: addressId, customerId } });
  }

  findVariantForCheckout(variantId: string) {
    return this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
      include: {
        product: true,
        inventory: true,
        attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
      },
    });
  }

  /**
   * Creates the Order, its OrderItems, the initial Payment and
   * OrderStatusHistory row, and decrements inventory — all in one
   * transaction so concurrent checkouts can't oversell stock. Also returns
   * any variants that crossed into low/out-of-stock territory as a result,
   * so the caller can notify the owning merchant.
   */
  async createOrder(data: {
    orderNumber: string;
    customerId: string;
    shippingAddressId: string;
    billingAddressId: string;
    paymentMethod: PaymentMethod;
    lines: CartLineForCheckout[];
  }) {
    const subtotal = data.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const total = subtotal; // shippingFee/tax/discount default to 0 — no shipping/tax engine in scope yet

    // COD orders are confirmed immediately — no admin gate — with an unpaid
    // balance collected on delivery; every other payment method keeps the
    // existing PENDING -> (webhook) -> CONFIRMED/CAPTURED flow untouched,
    // since it must wait for the payment to actually succeed.
    const isCod = data.paymentMethod === "COD";
    const initialOrderStatus: OrderStatus = isCod ? "CONFIRMED" : "PENDING";
    const initialItemStatus: OrderItemStatus = isCod ? "CONFIRMED" : "PENDING";
    const initialPaymentStatus: PaymentStatus = isCod ? "UNPAID" : "PENDING";

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: data.orderNumber,
          customerId: data.customerId,
          status: initialOrderStatus,
          subtotal,
          total,
          shippingAddressId: data.shippingAddressId,
          billingAddressId: data.billingAddressId,
          items: {
            create: data.lines.map((line) => ({
              merchantId: line.merchantId,
              productId: line.productId,
              variantId: line.variantId,
              productNameSnapshot: line.productNameSnapshot,
              variantSnapshot: line.variantSnapshot,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              totalPrice: line.unitPrice * line.quantity,
              status: initialItemStatus,
            })),
          },
          payment: {
            create: { method: data.paymentMethod, status: initialPaymentStatus, amount: total },
          },
          statusHistory: { create: { status: initialOrderStatus, changedByType: "CUSTOMER", changedById: data.customerId } },
        },
        include: orderDetailInclude,
      });

      // Conditional decrement: only succeeds if enough stock is still there at
      // commit time. A blind `decrement` would let two concurrent checkouts
      // both pass a stale pre-check and oversell — this re-checks quantity
      // atomically against the current row and aborts the whole order if not.
      const lowStockAlerts: LowStockAlert[] = [];
      for (const line of data.lines) {
        const result = await tx.inventory.updateMany({
          where: { variantId: line.variantId, quantity: { gte: line.quantity } },
          data: { quantity: { decrement: line.quantity } },
        });
        if (result.count === 0) {
          throw new InsufficientStockError(line.variantId);
        }
        const inventory = await tx.inventory.findUnique({
          where: { variantId: line.variantId },
          select: { quantity: true, lowStockThreshold: true },
        });
        if (inventory && inventory.quantity <= inventory.lowStockThreshold) {
          lowStockAlerts.push({
            merchantId: line.merchantId,
            productId: line.productId,
            variantId: line.variantId,
            productNameSnapshot: line.productNameSnapshot,
            quantity: inventory.quantity,
          });
        }
      }

      return { order, lowStockAlerts };
    });
  }

  async findCustomerOrders(customerId: string, page: number, limit: number) {
    const where: Prisma.OrderWhereInput = { customerId, deletedAt: null };
    const [items, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: { include: orderItemProductInclude }, payment: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, totalItems };
  }

  async findAdminOrders(filter: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethodFilter;
    customerId?: string;
    search?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.customerId ? { customerId: filter.customerId } : {}),
      ...(filter.search
        ? {
            OR: [
              { orderNumber: { contains: filter.search, mode: "insensitive" } },
              { customer: { firstName: { contains: filter.search, mode: "insensitive" } } },
              { customer: { lastName: { contains: filter.search, mode: "insensitive" } } },
              { customer: { email: { contains: filter.search, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(filter.paymentStatus || filter.paymentMethod
        ? {
            payment: {
              ...(filter.paymentStatus ? { status: filter.paymentStatus } : {}),
              ...(filter.paymentMethod === "COD"
                ? { method: "COD" }
                : filter.paymentMethod === "ONLINE"
                  ? { method: { not: "COD" } }
                  : {}),
            },
          }
        : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          payment: true,
          customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, ORDER_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, totalItems };
  }

  async findMerchantOrders(
    merchantId: string,
    page: number,
    limit: number,
    itemStatus?: OrderItemStatus,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ) {
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      items: { some: { merchantId, ...(itemStatus ? { status: itemStatus } : {}) } },
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: { where: { merchantId }, include: orderItemProductInclude },
          customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: buildOrderBy(sortBy, sortOrder, ORDER_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, totalItems };
  }

  findOrderDetail(id: string) {
    return this.prisma.order.findFirst({ where: { id, deletedAt: null }, include: orderDetailInclude });
  }

  findOrderItemById(id: string) {
    return this.prisma.orderItem.findUnique({ where: { id } });
  }

  updateOrderItemStatus(id: string, status: OrderItemStatus) {
    return this.prisma.orderItem.update({ where: { id }, data: { status } });
  }

  findItemsForOrder(orderId: string) {
    return this.prisma.orderItem.findMany({ where: { orderId } });
  }

  /** Used to broadcast admin-facing notifications (no per-order assigned admin exists). */
  async listActiveAdminIds(): Promise<string[]> {
    const admins = await this.prisma.adminUser.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }

  /** Order-level status + history write only — no item/inventory changes. */
  async updateOrderStatus(id: string, status: OrderStatus, actor: { type: ActorType; id: string }, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({ where: { id }, data: { status } });
      await tx.orderStatusHistory.create({
        data: { orderId: id, status, changedByType: actor.type, changedById: actor.id, note },
      });
      return order;
    });
  }

  private async restoreInventoryTx(
    tx: Prisma.TransactionClient,
    lines: { variantId: string; quantity: number }[],
  ) {
    for (const line of lines) {
      await tx.inventory.updateMany({
        where: { variantId: line.variantId },
        data: { quantity: { increment: line.quantity } },
      });
    }
  }

  /**
   * Terminates a whole order (CANCELLED / FAILED_DELIVERY / COD_REFUSED):
   * flips every given item to `itemStatus`, restores inventory for the
   * given lines, and writes both the order status and its history — all
   * in one transaction. Used by customer/admin cancel, admin reject, and
   * markCodRefused.
   */
  async applyTerminalOrderStatus(
    orderId: string,
    data: {
      status: Extract<OrderStatus, "CANCELLED" | "FAILED_DELIVERY" | "COD_REFUSED">;
      itemStatus: OrderItemStatus;
      actor: { type: ActorType; id: string };
      note?: string;
      cancelReason?: string;
      rejectionReason?: string;
      itemIds: string[];
      restoreLines: { variantId: string; quantity: number }[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: data.status,
          ...(data.cancelReason
            ? { cancelReason: data.cancelReason, cancelledByType: data.actor.type, cancelledById: data.actor.id }
            : {}),
          ...(data.rejectionReason ? { rejectionReason: data.rejectionReason } : {}),
        },
      });
      if (data.itemIds.length > 0) {
        await tx.orderItem.updateMany({ where: { id: { in: data.itemIds } }, data: { status: data.itemStatus } });
      }
      await this.restoreInventoryTx(tx, data.restoreLines);
      await tx.orderStatusHistory.create({
        data: { orderId, status: data.status, changedByType: data.actor.type, changedById: data.actor.id, note: data.note },
      });
      return order;
    });
  }

  /**
   * Cancels one merchant's own (non-terminal) items on a multi-merchant
   * order and restores their inventory — does NOT touch Order.status or
   * write history, since other merchants' items may still be active. The
   * caller inspects `remainingActiveItems` to decide whether to cascade
   * the whole order to CANCELLED via `updateOrderStatus`.
   */
  async cancelMerchantItems(orderId: string, merchantId: string, fromStatuses: OrderItemStatus[]) {
    return this.prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({ where: { orderId, merchantId, status: { in: fromStatuses } } });
      if (items.length > 0) {
        await tx.orderItem.updateMany({ where: { id: { in: items.map((i) => i.id) } }, data: { status: "CANCELLED" } });
        await this.restoreInventoryTx(tx, items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })));
      }
      const remainingActiveItems = await tx.orderItem.count({
        where: { orderId, status: { notIn: ["CANCELLED", "RETURNED", "FAILED_DELIVERY", "COD_REFUSED"] } },
      });
      return { cancelledItems: items, remainingActiveItems };
    });
  }

  /** Bulk-advances one merchant's items on an order (accept / processing / packed / shipped). */
  updateItemsStatusForMerchant(orderId: string, merchantId: string, fromStatuses: OrderItemStatus[], toStatus: OrderItemStatus) {
    return this.prisma.orderItem.updateMany({
      where: { orderId, merchantId, status: { in: fromStatuses } },
      data: { status: toStatus },
    });
  }

  /** Bulk-advances every merchant's items on an order (admin confirm / admin mark-delivered). */
  updateAllItemsStatus(orderId: string, fromStatuses: OrderItemStatus[], toStatus: OrderItemStatus) {
    return this.prisma.orderItem.updateMany({
      where: { orderId, status: { in: fromStatuses } },
      data: { status: toStatus },
    });
  }
}
