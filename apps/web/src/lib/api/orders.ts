import { apiClient } from "../api-client";
import type { ApiSuccessResponse } from "@mirakart/types";
import type { Order } from "../../types/order";
import type { PaginatedResult } from "../../types/catalog";

export type PaymentMethod = "CARD" | "UPI" | "NETBANKING" | "WALLET" | "COD";

export async function checkout(input: {
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethod: PaymentMethod;
}): Promise<Order> {
  const res = await apiClient.post<ApiSuccessResponse<Order>>("/orders/checkout", input);
  return res.data.data;
}

export async function fetchOrders(page = 1, limit = 10): Promise<PaginatedResult<Order>> {
  const res = await apiClient.get<ApiSuccessResponse<Order[]>>("/orders", { params: { page, limit } });
  return { data: res.data.data, meta: res.data.meta! };
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await apiClient.get<ApiSuccessResponse<Order>>(`/orders/${id}`);
  return res.data.data;
}

export async function fetchOrderTracking(id: string): Promise<{ orderId: string; status: string; history: { status: string; note: string | null; changedAt: string }[] }> {
  const res = await apiClient.get<ApiSuccessResponse<{ orderId: string; status: string; history: { status: string; note: string | null; changedAt: string }[] }>>(
    `/orders/${id}/tracking`,
  );
  return res.data.data;
}
