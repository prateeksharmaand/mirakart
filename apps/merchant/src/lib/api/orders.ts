import { apiClient } from "../api-client";

export interface MerchantOrder {
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
    merchantId: string;
  }>;
}

export async function listMerchantOrders(params: { page?: number; limit?: number; status?: string } = {}) {
  const res = await apiClient.get("/merchants/me/orders", { params });
  return res.data as { data: MerchantOrder[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getMerchantOrder(id: string): Promise<MerchantOrder> {
  const res = await apiClient.get(`/merchants/me/orders/${id}`);
  return res.data.data as MerchantOrder;
}

export async function updateOrderItemStatus(orderId: string, itemId: string, status: string): Promise<void> {
  await apiClient.patch(`/orders/${orderId}/items/${itemId}/status`, { status });
}
