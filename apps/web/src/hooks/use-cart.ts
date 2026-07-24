"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mirakart/ui";
import { addCartItem, clearCart, fetchCart, removeCartItem, updateCartItem } from "../lib/api/cart";
import { useAuthStore } from "../stores/auth-store";

const CART_KEY = ["cart"];

export function useCart() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({ queryKey: CART_KEY, queryFn: fetchCart, enabled: hasHydrated && isAuthenticated });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number; productName?: string }) =>
      addCartItem(variantId, quantity),
    onSuccess: (cart, variables) => {
      queryClient.setQueryData(CART_KEY, cart);
      toast({
        title: variables.productName ? `“${variables.productName}” has been added to your cart.` : "Added to cart",
        variant: "success",
        action: { label: "View cart", href: "/cart" },
      });
    },
    onError: (error: Error) => toast({ title: "Couldn't add to cart", description: error.message, variant: "danger" }),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, quantity),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
    onError: (error: Error) => toast({ title: "Couldn't update quantity", description: error.message, variant: "danger" }),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
    onError: (error: Error) => toast({ title: "Couldn't remove item", description: error.message, variant: "danger" }),
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  });
}
