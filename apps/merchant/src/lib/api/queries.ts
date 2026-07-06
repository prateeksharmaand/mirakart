import { apiClient } from "../api-client";

export interface MerchantQuery {
  id: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  isPublic: boolean;
  createdAt: string;
  guestName: string | null;
  guestEmail: string | null;
  customer?: { id: string; name: string; email: string } | null;
  product: { id: string; name: string; slug: string };
}

export async function listMerchantQueries(params: { page?: number; limit?: number; answered?: boolean } = {}) {
  const res = await apiClient.get("/merchants/me/queries", { params });
  return res.data as { data: MerchantQuery[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function answerQuery(queryId: string, answer: string): Promise<MerchantQuery> {
  const res = await apiClient.post(`/merchants/me/queries/${queryId}/answer`, { answer });
  return res.data.data as MerchantQuery;
}
