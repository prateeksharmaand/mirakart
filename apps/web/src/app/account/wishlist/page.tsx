"use client";

import * as React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@mirakart/ui";
import { ProductCard } from "../../../components/product-card";
import { useWishlist } from "../../../hooks/use-wishlist";

export default function WishlistPage() {
  const { data: items = [], isLoading } = useWishlist();

  return (
    <div className="mx-auto max-w-site px-gutter py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/account" className="hover:text-foreground">Account</Link>
        <span>/</span>
        <span className="text-foreground">Wishlist</span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <Heart className="h-5 w-5 text-red-500" fill="currentColor" />
        <h1 className="text-2xl font-semibold text-foreground">My Wishlist</h1>
        {items.length > 0 && (
          <span className="rounded-full bg-border px-2.5 py-0.5 text-xs text-foreground-muted">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[3/4] animate-pulse rounded bg-border" />
              <div className="h-4 animate-pulse rounded bg-border" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-border" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Browse products and tap the heart icon to save your favourites here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
