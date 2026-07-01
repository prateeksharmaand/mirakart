import { apiClient } from "../api-client";

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customer?: { id: string; firstName: string; lastName: string; email: string } | null;
  items?: Array<{
    id: string;
    productName: string;
    variantSku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: string;
  }>;
  payment?: { status: string; method: string } | null;
}

export async function listOrders(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
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
