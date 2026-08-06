import { apiClient } from "../api-client";

export type ReturnStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "AWAITING_SHIPMENT"
  | "ITEM_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

export type ReturnResolutionType = "REFUND" | "REPLACEMENT";

export interface VariantAttributeValue {
  attributeValue: {
    id: string;
    value: string;
    colorHex: string | null;
    attribute: { id: string; name: string; type: string };
  };
}

export interface MerchantReturn {
  id: string;
  returnNumber: string;
  status: ReturnStatus;
  quantity: number;
  refundAmount: string | null;
  resolutionType: ReturnResolutionType;
  replacementVariant: { id: string; sku: string; attributeValues: VariantAttributeValue[] } | null;
  createdAt: string;
  order?: { id: string; orderNumber: string } | null;
  orderItem?: {
    productNameSnapshot: string;
    variantSnapshot: { sku: string; attributes: { attributeName: string; value: string; colorHex: string | null }[] };
    totalPrice: number;
  } | null;
  customer?: { id: string; firstName: string; lastName: string } | null;
  reason?: { id: string; reason: string } | null;
  reasonDetail?: string | null;
  images?: Array<{ id: string; media: { url: string } }>;
}

export async function listMerchantReturns(
  params: { page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: "asc" | "desc" } = {},
) {
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

export async function markReturnItemReceived(id: string): Promise<void> {
  await apiClient.patch(`/merchants/me/returns/${id}/status`, { status: "ITEM_RECEIVED" });
}

export async function completeReturn(id: string, refundAmount?: number): Promise<void> {
  await apiClient.patch(`/merchants/me/returns/${id}/status`, { status: "COMPLETED", refundAmount });
}
