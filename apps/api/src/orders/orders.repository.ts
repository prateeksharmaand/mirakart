import { Injectable } from "@nestjs/common";
import type { OrderItemStatus, OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { buildOrderBy } from "../common/utils/sort.util";

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

const orderDetailInclude = {
  items: true,
  payment: true,
  statusHistory: { orderBy: { changedAt: "asc" as const } },
  shippingAddress: true,
  billingAddress: true,
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
   * transaction so concurrent checkouts can't oversell stock.
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

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: data.orderNumber,
          customerId: data.customerId,
          status: "PENDING",
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
              status: "PENDING",
            })),
          },
          payment: {
            create: { method: data.paymentMethod, status: "PENDING", amount: total },
          },
          statusHistory: { create: { status: "PENDING" } },
        },
        include: orderDetailInclude,
      });

      // Conditional decrement: only succeeds if enough stock is still there at
      // commit time. A blind `decrement` would let two concurrent checkouts
      // both pass a stale pre-check and oversell — this re-checks quantity
      // atomically against the current row and aborts the whole order if not.
      for (const line of data.lines) {
        const result = await tx.inventory.updateMany({
          where: { variantId: line.variantId, quantity: { gte: line.quantity } },
          data: { quantity: { decrement: line.quantity } },
        });
        if (result.count === 0) {
          throw new InsufficientStockError(line.variantId);
        }
      }

      return order;
    });
  }

  async findCustomerOrders(customerId: string, page: number, limit: number) {
    const where: Prisma.OrderWhereInput = { customerId, deletedAt: null };
    const [items, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
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
    customerId?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.customerId ? { customerId: filter.customerId } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder, ORDER_SORT_FIELDS, "createdAt"),
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, totalItems };
  }

  async findMerchantOrders(merchantId: string, page: number, limit: number) {
    const where: Prisma.OrderWhereInput = { deletedAt: null, items: { some: { merchantId } } };
    const [items, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: { where: { merchantId } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
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

  async updateOrderStatus(id: string, status: OrderStatus, changedById?: string, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({ where: { id }, data: { status } });
      await tx.orderStatusHistory.create({ data: { orderId: id, status, changedById, note } });
      return order;
    });
  }
}
