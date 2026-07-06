"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mirakart/ui";
import {
  fetchWishlist,
  fetchWishlistProductIds,
  toggleWishlist,
  removeFromWishlist,
} from "../lib/api/wishlist";
import { useAuthStore } from "../stores/auth-store";

const WISHLIST_KEY = ["wishlist"];
const WISHLIST_IDS_KEY = ["wishlist-ids"];

export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: fetchWishlist,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useWishlistProductIds() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: WISHLIST_IDS_KEY,
    queryFn: fetchWishlistProductIds,
    enabled: isAuthenticated,
    staleTime: 60_000,
    select: (data) => new Set(data.map((d) => d.productId)),
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => toggleWishlist(productId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
      queryClient.invalidateQueries({ queryKey: WISHLIST_IDS_KEY });
      toast({
        title: result.wishlisted ? "Added to wishlist" : "Removed from wishlist",
        variant: result.wishlisted ? "success" : "default",
      });
    },
    onError: (error: Error) =>
      toast({ title: "Wishlist error", description: error.message, variant: "danger" }),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
      queryClient.invalidateQueries({ queryKey: WISHLIST_IDS_KEY });
    },
    onError: (error: Error) =>
      toast({ title: "Couldn't remove from wishlist", description: error.message, variant: "danger" }),
  });
}
