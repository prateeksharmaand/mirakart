import type { OrderItemStatus, OrderStatus, PaymentStatus } from "@prisma/client";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "ACCEPTED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
  "FAILED_DELIVERY",
  "COD_REFUSED",
];

export const ORDER_ITEM_STATUSES: OrderItemStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ACCEPTED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
  "FAILED_DELIVERY",
  "COD_REFUSED",
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "AUTHORIZED",
  "CAPTURED",
  "FAILED",
  "REFUNDED",
  "UNPAID",
  "PAID",
];
