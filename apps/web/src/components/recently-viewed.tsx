"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { fetchRecentlyViewed, trackRecentlyViewed } from "../lib/api/recently-viewed";
import { useAuthStore } from "../stores/auth-store";
import { formatPrice } from "../lib/format";
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

// Compact vertical list — used as a sidebar column on the product detail page.
export function RecentlyViewedSidebar({ excludeProductId }: RecentlyViewedProps) {
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
    <div>
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">Recent Views</h4>
      <div className="flex flex-col gap-4">
        {filtered.slice(0, 3).map((item) => {
          const image = item.product.images[0]?.media;
          const onSale =
            item.product.compareAtPrice &&
            Number(item.product.compareAtPrice) > Number(item.product.basePrice);
          return (
            <Link key={item.id} href={`/p/${item.product.slug}`} className="flex items-start gap-3">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded bg-background-light">
                {image ? (
                  <Image src={image.url} alt={item.product.name} fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-border" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-foreground transition-colors hover:text-primary">
                  {item.product.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {formatPrice(item.product.basePrice)}
                  </span>
                  {onSale && (
                    <span className="text-xs text-foreground-muted line-through">
                      {formatPrice(item.product.compareAtPrice!)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
