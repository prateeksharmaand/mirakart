import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type OrderItemStatus, type OrderStatus } from "@prisma/client";
import { CartRepository } from "../cart/cart.repository";
import { NotificationsService } from "../notifications/notifications.service";
import { InsufficientStockError, OrdersRepository, type CartLineForCheckout } from "./orders.repository";
import type { AdminOrderQueryDto } from "./dto/admin-order-query.dto";
import type { CheckoutDto } from "./dto/checkout.dto";
import { generateOrderNumber } from "./utils/order-number.util";

const ORDER_NUMBER_RETRY_ATTEMPTS = 3;

function paginate(page: number, limit: number, totalItems: number) {
  return { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly repo: OrdersRepository,
    private readonly cartRepo: CartRepository,
    private readonly notifications: NotificationsService,
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

  async updateOrderStatus(id: string, adminId: string, status: OrderStatus, note?: string) {
    const order = await this.findForAdmin(id);
    const updated = await this.repo.updateOrderStatus(id, status, adminId, note);
    const statusLabels: Partial<Record<OrderStatus, string>> = {
      PROCESSING: "is being processed",
      SHIPPED: "has been shipped",
      DELIVERED: "has been delivered",
      CANCELLED: "has been cancelled",
    };
    const label = statusLabels[status];
    if (label && order.customerId) {
      void this.notifications.create(
        "CUSTOMER", order.customerId,
        "ORDER_STATUS_CHANGED",
        `Order #${order.orderNumber} ${label}`,
        note ?? `Your order #${order.orderNumber} ${label}.`,
        { orderId: id, status },
      );
    }
    return updated;
  }

  async listForMerchant(merchantId: string, page: number, limit: number) {
    const { items, totalItems } = await this.repo.findMerchantOrders(merchantId, page, limit);
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
}
