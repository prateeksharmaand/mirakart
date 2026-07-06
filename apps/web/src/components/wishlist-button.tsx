"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useWishlistProductIds, useToggleWishlist } from "../hooks/use-wishlist";
import { useAuthStore } from "../stores/auth-store";

interface WishlistButtonProps {
  productId: string;
  productSlug: string;
  className?: string;
}

export function WishlistButton({ productId, productSlug, className = "" }: WishlistButtonProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const { data: wishlistIds } = useWishlistProductIds();
  const toggle = useToggleWishlist();
  const isWishlisted = wishlistIds?.has(productId) ?? false;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/login?next=/p/${productSlug}`);
      return;
    }
    toggle.mutate(productId);
  }

  return (
    <button
      type="button"
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      onClick={handleClick}
      disabled={toggle.isPending}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-soft transition-colors hover:bg-primary hover:text-white ${
        isWishlisted ? "text-red-500 hover:text-white" : "text-foreground"
      } ${className}`}
    >
      <Heart
        className="h-3.5 w-3.5 transition-transform"
        fill={isWishlisted ? "currentColor" : "none"}
      />
    </button>
  );
}
