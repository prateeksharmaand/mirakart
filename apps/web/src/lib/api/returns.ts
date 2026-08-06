import { apiClient } from "../api-client";
import type { ApiSuccessResponse } from "@mirakart/types";
import type { PaginatedResult } from "../../types/catalog";
import type { ReplacementOption, ReturnReason, ReturnRequest, ReturnResolutionType } from "../../types/return";

export async function fetchReturnReasons(): Promise<ReturnReason[]> {
  const res = await apiClient.get<ApiSuccessResponse<ReturnReason[]>>("/return-reasons");
  return res.data.data;
}

export async function fetchReplacementOptions(orderItemId: string): Promise<ReplacementOption[]> {
  const res = await apiClient.get<ApiSuccessResponse<ReplacementOption[]>>(
    `/returns/order-items/${orderItemId}/replacement-options`,
  );
  return res.data.data;
}

export async function fetchReturns(page = 1, limit = 10): Promise<PaginatedResult<ReturnRequest>> {
  const res = await apiClient.get<ApiSuccessResponse<ReturnRequest[]>>("/returns", { params: { page, limit } });
  return { data: res.data.data, meta: res.data.meta! };
}

export async function fetchReturn(id: string): Promise<ReturnRequest> {
  const res = await apiClient.get<ApiSuccessResponse<ReturnRequest>>(`/returns/${id}`);
  return res.data.data;
}

export async function createReturn(input: {
  orderItemId: string;
  reasonId: string;
  reasonDetail?: string;
  quantity: number;
  imageMediaIds: string[];
  resolutionType?: ReturnResolutionType;
  replacementVariantId?: string;
}): Promise<ReturnRequest> {
  const res = await apiClient.post<ApiSuccessResponse<ReturnRequest>>("/returns", input);
  return res.data.data;
}

export async function cancelReturn(id: string): Promise<ReturnRequest> {
  const res = await apiClient.patch<ApiSuccessResponse<ReturnRequest>>(`/returns/${id}/cancel`);
  return res.data.data;
}
