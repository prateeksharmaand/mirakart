import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type ActorType, type OrderItemStatus, type OrderStatus } from "@prisma/client";
import { CartRepository } from "../cart/cart.repository";
import { NotificationsService } from "../notifications/notifications.service";
import { PaymentsService } from "../payments/payments.service";
import { InsufficientStockError, OrdersRepository, type CartLineForCheckout } from "./orders.repository";
import type { AdminOrderQueryDto } from "./dto/admin-order-query.dto";
import type { CheckoutDto } from "./dto/checkout.dto";
import type { FulfillmentStatus } from "./dto/update-fulfillment-status.dto";
import { generateOrderNumber } from "./utils/order-number.util";
import {
  canAdvanceItem,
  canCancel,
  ITEM_TERMINAL_STATUSES,
  nextGatedOrderStatus,
  ORDER_ITEM_STATUS_RANK,
  ORDER_STATUS_RANK,
} from "./order-workflow.util";

const ORDER_NUMBER_RETRY_ATTEMPTS = 3;

function paginate(page: number, limit: number, totalItems: number) {
  return { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) };
}

type OrderDetail = NonNullable<Awaited<ReturnType<OrdersRepository["findOrderDetail"]>>>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly repo: OrdersRepository,
    private readonly cartRepo: CartRepository,
    private readonly notifications: NotificationsService,
    private readonly payments: PaymentsService,
  ) {}

  async checkout(customerId: string, dto: CheckoutDto) {
    const [shippingAddress, billingAddress] = await Promise.all([
      this.repo.findAddressForCustomer(dto.shippingAddressId, customerId),
      this.repo.findAddressForCustomer(dto.billingAddressId, customerId),
    ]);
    if (!shippingAddress) throw new NotFoundException("Shipping address not found");
    if (!billingAddress) throw new NotFoundException("Billing address not found");

    const cart = await this.cartRepo.findCartWithItems(customerId);
    if (!cart || cart.items.length === 0) throw new BadRequestException("Cart is empty");

    const lines: CartLineForCheckout[] = [];
    for (const item of cart.items) {
      const variant = await this.repo.findVariantForCheckout(item.variantId);
      if (!variant) throw new BadRequestException(`A product in your cart is no longer available`);
      if (variant.product.status !== "APPROVED" || variant.product.deletedAt) {
        throw new BadRequestException(`"${variant.product.name}" is no longer available for purchase`);
      }
      if ((variant.inventory?.quantity ?? 0) < item.quantity) {
        throw new BadRequestException(`Insufficient stock for "${variant.product.name}"`);
      }
      lines.push({
        variantId: variant.id,
        merchantId: variant.product.merchantId,
        productId: variant.productId,
        productNameSnapshot: variant.product.name,
        variantSnapshot: {
          sku: variant.sku,
          attributes: variant.attributeValues.map((av) => ({
            attributeName: av.attributeValue.attribute.name,
            value: av.attributeValue.value,
            colorHex: av.attributeValue.colorHex,
          })),
        },
        quantity: item.quantity,
        unitPrice: Number(variant.price),
      });
    }

    const order = await this.createOrderWithRetry(customerId, dto, lines);
    await this.cartRepo.clearItems(cart.id);

    if (dto.paymentMethod === "COD") {
      for (const adminId of await this.repo.listActiveAdminIds()) {
        this.notify(
          "ADMIN",
          adminId,
          "NEW_COD_ORDER",
          "New COD order awaiting confirmation",
          `Order #${order.orderNumber} was placed via Cash on Delivery and needs confirmation.`,
          { orderId: order.id },
        );
      }
    }

    return order;
  }

  private async createOrderWithRetry(customerId: string, dto: CheckoutDto, lines: CartLineForCheckout[]) {
    for (let attempt = 1; attempt <= ORDER_NUMBER_RETRY_ATTEMPTS; attempt++) {
      try {
        return await this.repo.createOrder({
          orderNumber: generateOrderNumber(),
          customerId,
          shippingAddressId: dto.shippingAddressId,
          billingAddressId: dto.billingAddressId,
          paymentMethod: dto.paymentMethod,
          lines,
        });
      } catch (error) {
        if (error instanceof InsufficientStockError) {
          throw new ConflictException(
            "Stock changed while placing your order — please review your cart and try again",
          );
        }
        const isOrderNumberCollision =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          (error.meta?.target as string[] | undefined)?.includes("orderNumber");
        if (isOrderNumberCollision && attempt < ORDER_NUMBER_RETRY_ATTEMPTS) continue;
        throw error;
      }
    }
    throw new ConflictException("Could not generate a unique order number — please try again");
  }

  async listForCustomer(customerId: string, page: number, limit: number) {
    const { items, totalItems } = await this.repo.findCustomerOrders(customerId, page, limit);
    return { data: items, meta: paginate(page, limit, totalItems) };
  }

  async findForCustomer(id: string, customerId: string) {
    const order = await this.repo.findOrderDetail(id);
    if (!order || order.customerId !== customerId) throw new NotFoundException("Order not found");
    return order;
  }

  async getTracking(id: string, customerId: string) {
    const order = await this.findForCustomer(id, customerId);
    return { orderId: order.id, status: order.status, history: order.statusHistory };
  }

  async listForAdmin(query: AdminOrderQueryDto) {
    const { items, totalItems } = await this.repo.findAdminOrders({
      status: query.status,
      paymentStatus: query.paymentStatus,
      paymentMethod: query.paymentMethod,
      customerId: query.customerId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { data: items, meta: paginate(query.page, query.limit, totalItems) };
  }

  async findForAdmin(id: string) {
    const order = await this.repo.findOrderDetail(id);
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  /** Generic admin path — kept for backward compatibility, now transition-validated too. */
  async updateOrderStatus(id: string, adminId: string, status: OrderStatus, note?: string) {
    const order = await this.findForAdmin(id);
    const updated = await this.repo.updateOrderStatus(id, status, { type: "ADMIN", id: adminId }, note);
    const statusLabels: Partial<Record<OrderStatus, string>> = {
      PROCESSING: "is being processed",
      SHIPPED: "has been shipped",
      DELIVERED: "has been delivered",
      CANCELLED: "has been cancelled",
    };
    const label = statusLabels[status];
    if (label && order.customerId) {
      this.notify(
        "CUSTOMER",
        order.customerId,
        "ORDER_STATUS_CHANGED",
        `Order #${order.orderNumber} ${label}`,
        note ?? `Your order #${order.orderNumber} ${label}.`,
        { orderId: id, status },
      );
    }
    return updated;
  }

  // ===========================================================
  // Admin: COD confirmation
  // ===========================================================

  async adminConfirmOrder(orderId: string, adminId: string) {
    const order = await this.findForAdmin(orderId);
    if (order.status !== "PENDING_CONFIRMATION") {
      throw new ConflictException("Order is not awaiting confirmation");
    }
    await this.repo.updateAllItemsStatus(orderId, ["PENDING"], "CONFIRMED");
    const updated = await this.repo.updateOrderStatus(orderId, "CONFIRMED", { type: "ADMIN", id: adminId });

    this.notify(
      "CUSTOMER",
      order.customerId,
      "ORDER_CONFIRMED",
      `Order #${order.orderNumber} confirmed`,
      `Your order #${order.orderNumber} has been confirmed and will be processed soon.`,
      { orderId },
    );
    for (const merchantId of this.distinctMerchantIds(order.items)) {
      this.notify(
        "MERCHANT",
        merchantId,
        "NEW_COD_ORDER",
        `New order #${order.orderNumber}`,
        "You have a new confirmed order to fulfill.",
        { orderId },
      );
    }
    return updated;
  }

  async adminRejectOrder(orderId: string, adminId: string, reason: string) {
    const order = await this.findForAdmin(orderId);
    if (order.status !== "PENDING_CONFIRMATION") {
      throw new ConflictException("Only orders awaiting confirmation can be rejected");
    }
    const updated = await this.repo.applyTerminalOrderStatus(orderId, {
      status: "CANCELLED",
      itemStatus: "CANCELLED",
      actor: { type: "ADMIN", id: adminId },
      note: reason,
      cancelReason: reason,
      rejectionReason: reason,
      itemIds: order.items.map((i) => i.id),
      restoreLines: order.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    });
    this.notify(
      "CUSTOMER",
      order.customerId,
      "ORDER_REJECTED",
      `Order #${order.orderNumber} could not be confirmed`,
      reason,
      { orderId },
    );
    return updated;
  }

  async adminMarkDelivered(orderId: string, adminId: string) {
    const order = await this.findForAdmin(orderId);
    if (order.status !== "SHIPPED" && order.status !== "OUT_FOR_DELIVERY") {
      throw new ConflictException("Order must be shipped before it can be marked delivered");
    }
    const activeStatuses = order.items
      .map((i) => i.status)
      .filter((s) => !ITEM_TERMINAL_STATUSES.has(s));
    if (activeStatuses.length > 0) {
      await this.repo.updateAllItemsStatus(orderId, [...new Set(activeStatuses)], "DELIVERED");
    }
    const updated = await this.repo.updateOrderStatus(orderId, "DELIVERED", { type: "ADMIN", id: adminId });
    this.notify(
      "CUSTOMER",
      order.customerId,
      "ORDER_DELIVERED",
      `Order #${order.orderNumber} delivered`,
      `Your order #${order.orderNumber} has been delivered.`,
      { orderId },
    );
    return updated;
  }

  async markCodReceived(
    orderId: string,
    adminId: string,
    data: { amountReceived: number; receivedDate: Date; remarks?: string },
  ) {
    const order = await this.findForAdmin(orderId);
    if (order.status !== "DELIVERED") {
      throw new ConflictException("Payment can only be collected after the order is delivered");
    }
    if (!order.payment || order.payment.method !== "COD") {
      throw new BadRequestException("This order was not paid by Cash on Delivery");
    }
    const result = await this.payments.markCodReceived(orderId, { ...data, adminId });

    this.notify(
      "CUSTOMER",
      order.customerId,
      "PAYMENT_RECEIVED",
      `Order #${order.orderNumber} completed`,
      "We've recorded your Cash on Delivery payment — your order is now complete.",
      { orderId },
    );
    for (const otherAdminId of await this.repo.listActiveAdminIds()) {
      this.notify(
        "ADMIN",
        otherAdminId,
        "COD_PAYMENT_RECEIVED",
        `COD payment received for #${order.orderNumber}`,
        `₹${data.amountReceived} recorded for order #${order.orderNumber}.`,
        { orderId },
      );
    }
    return result;
  }

  async markCodRefused(orderId: string, actor: { type: "MERCHANT" | "ADMIN"; id: string }, reason: string) {
    const order = await this.findForAdmin(orderId);
    if (order.status !== "DELIVERED") {
      throw new ConflictException("Only a delivered order can be marked as refused");
    }
    if (actor.type === "MERCHANT" && !order.items.some((i) => i.merchantId === actor.id)) {
      throw new ForbiddenException("This order does not belong to your store");
    }
    const updated = await this.repo.applyTerminalOrderStatus(orderId, {
      status: "COD_REFUSED",
      itemStatus: "COD_REFUSED",
      actor,
      note: reason,
      itemIds: order.items.map((i) => i.id),
      restoreLines: order.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    });
    this.notify(
      "CUSTOMER",
      order.customerId,
      "ORDER_DELIVERY_FAILED",
      `Delivery of order #${order.orderNumber} failed`,
      reason,
      { orderId },
    );
    return updated;
  }

  // ===========================================================
  // Merchant: accept / reject / fulfillment
  // ===========================================================

  async merchantAcceptOrder(orderId: string, merchantId: string) {
    const order = await this.findForMerchant(orderId, merchantId);
    if (order.items.some((i) => i.status !== "CONFIRMED")) {
      throw new ConflictException("These items are not awaiting acceptance");
    }
    await this.repo.updateItemsStatusForMerchant(orderId, merchantId, ["CONFIRMED"], "ACCEPTED");
    await this.recomputeGatedOrderStatus(orderId, { type: "MERCHANT", id: merchantId });

    const full = await this.repo.findOrderDetail(orderId);
    if (full) {
      this.notify(
        "CUSTOMER",
        full.customerId,
        "ORDER_ACCEPTED",
        `Order #${full.orderNumber} accepted`,
        `Your order #${full.orderNumber} has been accepted and will be processed soon.`,
        { orderId },
      );
    }
    return this.findForMerchant(orderId, merchantId);
  }

  async merchantRejectOrder(orderId: string, merchantId: string, reason: string) {
    const order = await this.findForMerchant(orderId, merchantId);
    if (order.items.some((i) => i.status !== "CONFIRMED")) {
      throw new ConflictException("These items are not awaiting acceptance");
    }
    const { remainingActiveItems } = await this.repo.cancelMerchantItems(orderId, merchantId, ["CONFIRMED"]);
    if (remainingActiveItems === 0) {
      await this.repo.updateOrderStatus(orderId, "CANCELLED", { type: "MERCHANT", id: merchantId }, reason);
    }
    const full = await this.repo.findOrderDetail(orderId);
    if (full) {
      this.notify(
        "CUSTOMER",
        full.customerId,
        "ORDER_REJECTED",
        `Part of order #${full.orderNumber} was declined`,
        reason,
        { orderId },
      );
    }
    return this.findForMerchant(orderId, merchantId);
  }

  async merchantUpdateFulfillment(orderId: string, merchantId: string, status: FulfillmentStatus) {
    const order = await this.findForMerchant(orderId, merchantId);
    const activeItems = order.items.filter((i) => !ITEM_TERMINAL_STATUSES.has(i.status));
    if (activeItems.length === 0) throw new ConflictException("No active items to update");
    if (activeItems.some((i) => !canAdvanceItem(i.status, status))) {
      throw new ConflictException(`Items cannot move to ${status} from their current status`);
    }
    await this.repo.updateItemsStatusForMerchant(
      orderId,
      merchantId,
      [...new Set(activeItems.map((i) => i.status))],
      status,
    );
    await this.recomputeGatedOrderStatus(orderId, { type: "MERCHANT", id: merchantId });

    const labels: Record<FulfillmentStatus, string> = {
      PROCESSING: "is being processed",
      PACKED: "has been packed",
      SHIPPED: "has been shipped",
    };
    const full = await this.repo.findOrderDetail(orderId);
    if (full) {
      this.notify(
        "CUSTOMER",
        full.customerId,
        "ORDER_STATUS_CHANGED",
        `Order #${full.orderNumber} ${labels[status]}`,
        `Your order #${full.orderNumber} ${labels[status]}.`,
        { orderId, status },
      );
    }
    return this.findForMerchant(orderId, merchantId);
  }

  private async recomputeGatedOrderStatus(orderId: string, actor: { type: ActorType; id: string }) {
    const [order, items] = await Promise.all([this.repo.findOrderDetail(orderId), this.repo.findItemsForOrder(orderId)]);
    if (!order) return;
    const candidate = nextGatedOrderStatus(items.map((i) => i.status));
    if (!candidate) return;
    const currentRank = ORDER_STATUS_RANK.indexOf(order.status);
    const candidateRank = ORDER_STATUS_RANK.indexOf(candidate);
    if (candidateRank > currentRank) {
      await this.repo.updateOrderStatus(orderId, candidate, actor);
    }
  }

  // ===========================================================
  // Cancellation — one shared implementation for all three actors
  // ===========================================================

  async customerCancelOrder(orderId: string, customerId: string, reason?: string) {
    const order = await this.findForCustomer(orderId, customerId);
    if (!canCancel(order.status, "CUSTOMER")) {
      throw new ConflictException("This order can no longer be cancelled");
    }
    return this.cancelWholeOrder(order, { type: "CUSTOMER", id: customerId }, reason);
  }

  async merchantCancelOrder(orderId: string, merchantId: string, reason?: string) {
    const order = await this.findForMerchant(orderId, merchantId);
    const activeItems = order.items.filter((i) => !ITEM_TERMINAL_STATUSES.has(i.status));
    if (activeItems.length === 0) throw new ConflictException("No active items to cancel");

    const shippedRank = ORDER_ITEM_STATUS_RANK.indexOf("SHIPPED");
    const tooLate = activeItems.some((i) => ORDER_ITEM_STATUS_RANK.indexOf(i.status) >= shippedRank);
    if (tooLate) throw new ConflictException("These items have already shipped and can no longer be cancelled");

    const { remainingActiveItems } = await this.repo.cancelMerchantItems(
      orderId,
      merchantId,
      [...new Set(activeItems.map((i) => i.status))],
    );
    if (remainingActiveItems === 0) {
      await this.repo.updateOrderStatus(orderId, "CANCELLED", { type: "MERCHANT", id: merchantId }, reason);
    }
    const full = await this.repo.findOrderDetail(orderId);
    if (full) {
      this.notify(
        "CUSTOMER",
        full.customerId,
        "ORDER_CANCELLED",
        `Part of order #${full.orderNumber} was cancelled`,
        reason ?? "Cancelled by the seller.",
        { orderId },
      );
    }
    return this.findForMerchant(orderId, merchantId);
  }

  async adminCancelOrder(orderId: string, adminId: string, reason?: string) {
    const order = await this.findForAdmin(orderId);
    if (!canCancel(order.status, "ADMIN")) {
      throw new ConflictException("This order can no longer be cancelled");
    }
    return this.cancelWholeOrder(order, { type: "ADMIN", id: adminId }, reason);
  }

  private async cancelWholeOrder(order: OrderDetail, actor: { type: ActorType; id: string }, reason?: string) {
    const activeItems = order.items.filter((i) => !ITEM_TERMINAL_STATUSES.has(i.status));
    const updated = await this.repo.applyTerminalOrderStatus(order.id, {
      status: "CANCELLED",
      itemStatus: "CANCELLED",
      actor,
      note: reason,
      cancelReason: reason,
      itemIds: activeItems.map((i) => i.id),
      restoreLines: activeItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    });

    this.notify(
      "CUSTOMER",
      order.customerId,
      "ORDER_CANCELLED",
      `Order #${order.orderNumber} cancelled`,
      reason ?? "Your order has been cancelled.",
      { orderId: order.id },
    );
    for (const merchantId of this.distinctMerchantIds(order.items)) {
      this.notify(
        "MERCHANT",
        merchantId,
        "ORDER_CANCELLED",
        `Order #${order.orderNumber} cancelled`,
        `Order #${order.orderNumber} has been cancelled.`,
        { orderId: order.id },
      );
    }
    return updated;
  }

  // ===========================================================
  // Merchant / admin listing & legacy per-item status update
  // ===========================================================

  async listForMerchant(merchantId: string, page: number, limit: number, itemStatus?: OrderItemStatus) {
    const { items, totalItems } = await this.repo.findMerchantOrders(merchantId, page, limit, itemStatus);
    return { data: items, meta: paginate(page, limit, totalItems) };
  }

  async findForMerchant(id: string, merchantId: string) {
    const order = await this.repo.findOrderDetail(id);
    const ownItems = order?.items.filter((item) => item.merchantId === merchantId) ?? [];
    if (!order || ownItems.length === 0) throw new NotFoundException("Order not found");
    // Only this merchant's line items are returned — a multi-vendor order's
    // other merchants' items/pricing are not this merchant's business.
    return { ...order, items: ownItems };
  }

  async updateItemStatus(
    orderId: string,
    itemId: string,
    status: OrderItemStatus,
    requester: { type: "MERCHANT" | "ADMIN"; id: string },
  ) {
    const item = await this.repo.findOrderItemById(itemId);
    if (!item || item.orderId !== orderId) throw new NotFoundException("Order item not found");
    if (requester.type === "MERCHANT" && item.merchantId !== requester.id) {
      throw new ForbiddenException("This order item does not belong to your store");
    }
    return this.repo.updateOrderItemStatus(itemId, status);
  }

  private distinctMerchantIds(items: { merchantId: string }[]): string[] {
    return [...new Set(items.map((i) => i.merchantId))];
  }

  private notify(
    recipientType: "ADMIN" | "MERCHANT" | "CUSTOMER",
    recipientId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    void this.notifications.create(recipientType, recipientId, type, title, message, data as Prisma.InputJsonValue);
  }
}
