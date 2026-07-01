import { apiClient } from "../api-client";

export interface Merchant {
  id: string;
  email: string;
  storeName: string;
  storeSlug: string;
  phone: string;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
  logoMedia?: { url: string } | null;
}

export interface MerchantDocument {
  id: string;
  type: string;
  status: string;
  url: string;
  rejectionReason?: string | null;
}

export async function listMerchants(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  const res = await apiClient.get("/merchants", { params });
  return res.data as { data: Merchant[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getMerchant(id: string): Promise<Merchant> {
  const res = await apiClient.get(`/merchants/${id}`);
  return res.data.data as Merchant;
}

export async function getMerchantDocuments(id: string): Promise<MerchantDocument[]> {
  const res = await apiClient.get(`/merchants/${id}/documents`);
  return res.data.data as MerchantDocument[];
}

export async function approveMerchant(id: string): Promise<Merchant> {
  const res = await apiClient.patch(`/merchants/${id}/approve`);
  return res.data.data as Merchant;
}

export async function rejectMerchant(id: string, rejectionReason: string): Promise<Merchant> {
  const res = await apiClient.patch(`/merchants/${id}/reject`, { rejectionReason });
  return res.data.data as Merchant;
}

export async function suspendMerchant(id: string): Promise<Merchant> {
  const res = await apiClient.patch(`/merchants/${id}/suspend`);
  return res.data.data as Merchant;
}

export async function reviewDocument(
  merchantId: string,
  docId: string,
  data: { status: "APPROVED" | "REJECTED"; rejectionReason?: string },
): Promise<void> {
  await apiClient.patch(`/merchants/${merchantId}/documents/${docId}`, data);
}
