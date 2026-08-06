import { apiClient } from "../api-client";

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

export type PaymentStatus = "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" | "UNPAID" | "PAID";
export type PaymentMethodFilter = "COD" | "ONLINE";
export type DispatchMethod = "COURIER" | "SELF_DELIVERY";

export interface OrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  note: string | null;
  changedAt: string;
  changedByType: "ADMIN" | "MERCHANT" | "CUSTOMER" | "SYSTEM" | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  rejectionReason?: string | null;
  cancelReason?: string | null;
  customer?: { id: string; firstName: string; lastName: string; email: string; phone: string } | null;
  shippingAddress?: OrderAddress | null;
  billingAddress?: OrderAddress | null;
  statusHistory?: OrderStatusHistoryEntry[];
  items?: Array<{
    id: string;
    productNameSnapshot: string;
    variantSnapshot: { sku: string; attributes: { attributeName: string; value: string }[] };
    merchantId: string;
    merchant?: { storeName: string } | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: OrderStatus;
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
  }>;
  payment?: {
    status: PaymentStatus;
    method: string;
    amount: number;
    amountReceived?: number | null;
    paidAt?: string | null;
    collectionNote?: string | null;
  } | null;
}

export async function listOrders(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    merchantId?: string;
    dispatchMethod?: DispatchMethod;
    paymentStatus?: string;
    paymentMethod?: PaymentMethodFilter;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {},
) {
  const res = await apiClient.get("/admin/orders", { params });
  return res.data as { data: Order[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getOrder(id: string): Promise<Order> {
  const res = await apiClient.get(`/admin/orders/${id}`);
  return res.data.data as Order;
}
