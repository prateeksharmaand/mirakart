import { apiClient } from "../api-client";
import type { ApiSuccessResponse } from "@mirakart/types";

export interface CustomerQueryItem {
  id: string;
  productId: string;
  customerId: string | null;
  customer: { id: string; firstName: string; lastName: string } | null;
  guestName: string | null;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  isPublic: boolean;
  createdAt: string;
}

export async function fetchProductQueries(productId: string): Promise<CustomerQueryItem[]> {
  const res = await apiClient.get<ApiSuccessResponse<CustomerQueryItem[]>>(
    `/products/${productId}/queries`,
  );
  return res.data.data;
}

export async function submitQuery(
  productId: string,
  question: string,
): Promise<CustomerQueryItem> {
  const res = await apiClient.post<ApiSuccessResponse<CustomerQueryItem>>(
    `/products/${productId}/queries`,
    { question },
  );
  return res.data.data;
}
