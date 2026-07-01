import { apiClient } from "../api-client";

export interface MerchantReturn {
  id: string;
  status: string;
  createdAt: string;
  order?: { id: string; orderNumber: string } | null;
  customer?: { id: string; firstName: string; lastName: string } | null;
  reason?: { name: string } | null;
  description?: string | null;
  images?: Array<{ id: string; media: { url: string } }>;
}

export async function listMerchantReturns(params: { page?: number; limit?: number; status?: string } = {}) {
  const res = await apiClient.get("/merchants/me/returns", { params });
  return res.data as { data: MerchantReturn[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getMerchantReturn(id: string): Promise<MerchantReturn> {
  const res = await apiClient.get(`/merchants/me/returns/${id}`);
  return res.data.data as MerchantReturn;
}

export async function acceptReturn(id: string): Promise<void> {
  await apiClient.patch(`/merchants/me/returns/${id}/approve`);
}

export async function rejectReturn(id: string, note: string): Promise<void> {
  await apiClient.patch(`/merchants/me/returns/${id}/reject`, { note });
}
