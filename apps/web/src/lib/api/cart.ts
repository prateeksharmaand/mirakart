import { apiClient } from "../api-client";
import type { ApiSuccessResponse } from "@mirakart/types";
import type { Cart } from "../../types/cart";

export async function fetchCart(): Promise<Cart> {
  const res = await apiClient.get<ApiSuccessResponse<Cart>>("/cart");
  return res.data.data;
}

export async function addCartItem(variantId: string, quantity: number): Promise<Cart> {
  const res = await apiClient.post<ApiSuccessResponse<Cart>>("/cart/items", { variantId, quantity });
  return res.data.data;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const res = await apiClient.patch<ApiSuccessResponse<Cart>>(`/cart/items/${itemId}`, { quantity });
  return res.data.data;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const res = await apiClient.delete<ApiSuccessResponse<Cart>>(`/cart/items/${itemId}`);
  return res.data.data;
}

export async function clearCart(): Promise<void> {
  await apiClient.delete("/cart");
}
