import { apiClient } from "../api-client";

export type OrderStatus =
  | "PENDING"
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "ACCEPTED"
  | "PROCESSING"
  | "PACKED"
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

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  rejectionReason?: string | null;
  cancelReason?: string | null;
  customer?: { id: string; firstName: string; lastName: string; email: string } | null;
  items?: Array<{
    id: string;
    productNameSnapshot: string;
    variantSnapshot: { sku: string; attributes: { attributeName: string; value: string }[] };
    merchantId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: OrderStatus;
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
    paymentStatus?: string;
    paymentMethod?: PaymentMethodFilter;
  } = {},
) {
  const res = await apiClient.get("/admin/orders", { params });
  return res.data as { data: Order[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getOrder(id: string): Promise<Order> {
  const res = await apiClient.get(`/admin/orders/${id}`);
  return res.data.data as Order;
}

export async function updateOrderStatus(id: string, status: string, note?: string): Promise<Order> {
  const res = await apiClient.patch(`/admin/orders/${id}/status`, { status, note });
  return res.data.data as Order;
}

export async function confirmOrder(id: string): Promise<Order> {
  const res = await apiClient.post(`/admin/orders/${id}/confirm`);
  return res.data.data as Order;
}

export async function rejectOrder(id: string, reason: string): Promise<Order> {
  const res = await apiClient.post(`/admin/orders/${id}/reject`, { reason });
  return res.data.data as Order;
}

export async function markOrderDelivered(id: string): Promise<Order> {
  const res = await apiClient.post(`/admin/orders/${id}/mark-delivered`);
  return res.data.data as Order;
}

export async function markCodReceived(
  id: string,
  data: { amountReceived: number; receivedDate: string; remarks?: string },
): Promise<Order> {
  const res = await apiClient.post(`/admin/orders/${id}/mark-cod-received`, data);
  return res.data.data as Order;
}

export async function markCodRefused(id: string, reason: string): Promise<Order> {
  const res = await apiClient.post(`/admin/orders/${id}/mark-cod-refused`, { reason });
  return res.data.data as Order;
}

export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  const res = await apiClient.post(`/admin/orders/${id}/cancel`, { reason });
  return res.data.data as Order;
}
