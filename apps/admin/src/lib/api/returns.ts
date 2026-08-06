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

export interface Return {
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
    variantSnapshot: { sku: string; attributes: { attributeName: string; value: string; colorHex: string | null }[] } | null;
  } | null;
  customer?: { id: string; firstName: string; lastName: string } | null;
  merchant?: { id: string; storeName: string } | null;
  reason?: { id: string; reason: string } | null;
  reasonDetail?: string | null;
  images?: Array<{ id: string; media: { url: string } | null }>;
}

export async function listReturns(
  params: { page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: "asc" | "desc" } = {},
) {
  const res = await apiClient.get("/admin/returns", { params });
  return res.data as { data: Return[]; meta: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export async function getReturn(id: string): Promise<Return> {
  const res = await apiClient.get(`/admin/returns/${id}`);
  return res.data.data as Return;
}
