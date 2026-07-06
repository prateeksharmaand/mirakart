import { apiClient } from "../api-client";
import type { ApiSuccessResponse } from "@mirakart/types";
import type { ProductListItem } from "../../types/catalog";

export interface RecentlyViewedItem {
  id: string;
  productId: string;
  viewedAt: string;
  product: ProductListItem;
}

export async function fetchRecentlyViewed(): Promise<RecentlyViewedItem[]> {
  const res = await apiClient.get<ApiSuccessResponse<RecentlyViewedItem[]>>("/recently-viewed");
  return res.data.data;
}

export async function trackRecentlyViewed(productId: string): Promise<void> {
  await apiClient.post(`/recently-viewed/${productId}`);
}
