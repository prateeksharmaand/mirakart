import { apiClient } from "../api-client";

export interface Return {
  id: string;
  status: string;
  createdAt: string;
  order?: { id: string; orderNumber: string } | null;
  customer?: { id: string; firstName: string; lastName: string } | null;
  merchant?: { id: string; storeName: string } | null;
  reason?: { name: string } | null;
  description?: string | null;
  images?: Array<{ id: string; media: { url: string } }>;
}

export async function listReturns(params: { page?: number; limit?: number; status?: string } = {}) {
  const res = await apiClient.get("/admin/returns", { params });
  return res.data as { data: Return[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getReturn(id: string): Promise<Return> {
  const res = await apiClient.get(`/admin/returns/${id}`);
  return res.data.data as Return;
}

export async function updateReturnStatus(id: string, status: string, note?: string): Promise<Return> {
  const res = await apiClient.patch(`/admin/returns/${id}/status`, { status, note });
  return res.data.data as Return;
}
