import type { CustomerAddress } from "./customer";

export type OrderStatus =
  | "PENDING"
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "ACCEPTED"
  | "PROCESSING"
  | "PACKED"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "FAILED_DELIVERY"
  | "COD_REFUSED";
export type OrderItemStatus = OrderStatus | "RETURNED";
export type PaymentStatus = "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" | "UNPAID" | "PAID";
export type DispatchMethod = "COURIER" | "SELF_DELIVERY";

export interface OrderItem {
  id: string;
  merchantId: string;
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  variantSnapshot: { sku: string; attributes: { attributeName: string; value: string; colorHex: string | null }[] } | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  status: OrderItemStatus;
  product?: {
    productCode: string;
    brand: { name: string } | null;
    images: { media: { url: string } }[];
  } | null;
  dispatchMethod: DispatchMethod | null;
  courierPartner: string | null;
  customCourierName: string | null;
  trackingNumber: string | null;
  deliveryPersonName: string | null;
  deliveryPersonPhone: string | null;
  vehicleNumber: string | null;
  dispatchDate: string | null;
  expectedDeliveryDate: string | null;
  deliveredAt: string | null;
  shipmentNotes: string | null;
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
  couponCode: string | null;
  total: string;
  currency: string;
  placedAt: string;
  items: OrderItem[];
  statusHistory?: OrderStatusHistoryEntry[];
  payment?: { method: string; status: PaymentStatus } | null;
  shippingAddress?: CustomerAddress | null;
  cancelReason?: string | null;
  rejectionReason?: string | null;
}
