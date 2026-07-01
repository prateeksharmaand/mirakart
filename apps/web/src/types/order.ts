export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
export type OrderItemStatus = OrderStatus | "RETURNED";

export interface OrderItem {
  id: string;
  merchantId: string;
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  variantSnapshot: { sku: string; attributes: { attributeName: string; value: string; colorHex: string | null }[] };
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  status: OrderItemStatus;
}

export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  note: string | null;
  changedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: string;
  shippingFee: string;
  tax: string;
  discount: string;
  total: string;
  currency: string;
  placedAt: string;
  items: OrderItem[];
  statusHistory?: OrderStatusHistoryEntry[];
}
