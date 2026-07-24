"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Maximize } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, Skeleton } from "@mirakart/ui";
import { getProductBySlug } from "../lib/api/catalog";
import { ProductGallery } from "./product-gallery";
import { ProductPurchasePanel } from "./product-purchase-panel";

interface QuickViewButtonProps {
  productSlug: string;
  className?: string;
}

export function QuickViewButton({ productSlug, className = "" }: QuickViewButtonProps) {
  const [open, setOpen] = React.useState(false);
  const { data: product, isLoading } = useQuery({
    queryKey: ["quick-view", productSlug],
    queryFn: () => getProductBySlug(productSlug),
    enabled: open,
    staleTime: 60_000,
  });

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label="Quick view"
        onClick={handleClick}
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-soft transition-colors hover:bg-primary hover:text-white ${className}`}
      >
        <Maximize className="h-3.5 w-3.5" />
      </button>

      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90dvh]">
        {isLoading || !product ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <Skeleton className="aspect-square w-full" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <ProductGallery images={product.images} productName={product.name} />
            <div className="flex flex-col gap-4">
              <div>
                {product.brand && (
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-foreground-muted">
                    {product.brand.name}
                  </span>
                )}
                <DialogTitle className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">
                  {product.name}
                </DialogTitle>
              </div>
              <ProductPurchasePanel product={product} />
              <Link
                href={`/p/${product.slug}`}
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                View full details
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
