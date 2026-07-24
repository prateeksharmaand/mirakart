"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useAddCartItem } from "../hooks/use-cart";
import { useAuthStore } from "../stores/auth-store";

interface QuickAddButtonProps {
  productSlug: string;
  /** Exactly one variant on the product — enables adding to cart directly from the grid. */
  singleVariantId?: string | null;
  variantCount?: number;
  isOutOfStock: boolean;
  className?: string;
}

export function QuickAddButton({ productSlug, singleVariantId, variantCount, isOutOfStock, className = "" }: QuickAddButtonProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const addToCart = useAddCartItem();

  const canQuickAdd = Boolean(singleVariantId) && (variantCount ?? 0) <= 1 && !isOutOfStock;

  if (!canQuickAdd) {
    return (
      <Link
        href={`/p/${productSlug}`}
        className={`absolute bottom-0 left-0 right-0 z-10 flex translate-y-full items-center justify-center gap-1.5 bg-foreground py-2.5 text-center text-xs font-medium uppercase tracking-wider text-background opacity-0 transition-all duration-300 ease-theme hover:bg-primary group-hover:translate-y-0 group-hover:opacity-100 ${className}`}
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        {isOutOfStock ? "View Product" : "Select Options"}
      </Link>
    );
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/login?next=/p/${productSlug}`);
      return;
    }
    addToCart.mutate({ variantId: singleVariantId as string, quantity: 1 });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={addToCart.isPending}
      className={`absolute bottom-0 left-0 right-0 z-10 flex translate-y-full items-center justify-center gap-1.5 bg-foreground py-2.5 text-center text-xs font-medium uppercase tracking-wider text-background opacity-0 transition-all duration-300 ease-theme hover:bg-primary group-hover:translate-y-0 group-hover:opacity-100 disabled:opacity-50 ${className}`}
    >
      <ShoppingBag className="h-3.5 w-3.5" />
      {addToCart.isPending ? "Adding…" : "Add to Cart"}
    </button>
  );
}
