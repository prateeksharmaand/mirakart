import { apiClient } from "../api-client";
import type { ApiSuccessResponse } from "@mirakart/types";
import type { ProductListItem } from "../../types/catalog";

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: ProductListItem;
}

export async function fetchWishlist(): Promise<WishlistItem[]> {
  const res = await apiClient.get<ApiSuccessResponse<WishlistItem[]>>("/wishlist");
  return res.data.data;
}

export async function fetchWishlistProductIds(): Promise<{ productId: string }[]> {
  const res = await apiClient.get<ApiSuccessResponse<{ productId: string }[]>>("/wishlist/product-ids");
  return res.data.data;
}

export async function toggleWishlist(productId: string): Promise<{ wishlisted: boolean }> {
  const res = await apiClient.post<ApiSuccessResponse<{ wishlisted: boolean }>>(`/wishlist/${productId}/toggle`);
  return res.data.data;
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await apiClient.delete(`/wishlist/${productId}`);
}
