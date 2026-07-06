"use client";

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchRecentlyViewed, trackRecentlyViewed } from "../lib/api/recently-viewed";
import { useAuthStore } from "../stores/auth-store";
import { ProductCard } from "./product-card";

interface RecentlyViewedProps {
  productId?: string; // if provided, track this product on mount
  excludeProductId?: string;
}

export function RecentlyViewedTracker({ productId }: { productId: string }) {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const { mutate } = useMutation({ mutationFn: () => trackRecentlyViewed(productId) });

  React.useEffect(() => {
    if (isAuthenticated) mutate();
  }, [productId, isAuthenticated]);

  return null;
}

export function RecentlyViewedSection({ excludeProductId }: RecentlyViewedProps) {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const { data: items = [] } = useQuery({
    queryKey: ["recently-viewed"],
    queryFn: fetchRecentlyViewed,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const filtered = excludeProductId
    ? items.filter((i) => i.productId !== excludeProductId)
    : items;

  if (!isAuthenticated || filtered.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-xl font-semibold text-foreground">Recently Viewed</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.slice(0, 5).map((item) => (
          <ProductCard key={item.id} product={item.product} />
        ))}
      </div>
    </section>
  );
}
