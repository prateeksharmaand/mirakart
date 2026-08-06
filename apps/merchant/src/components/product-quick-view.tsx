"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge, Dialog, DialogContent, DialogTitle, PRODUCT_STATUS_LABELS, Skeleton, StatusBadge } from "@mirakart/ui";
import { getMerchantProduct } from "../lib/api/products";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

interface Props {
  productId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ProductQuickView({ productId, onOpenChange }: Props) {
  const [selectedImg, setSelectedImg] = React.useState(0);
  const open = productId !== null;

  const { data: product, isLoading } = useQuery({
    queryKey: ["merchant-product-quick-view", productId],
    queryFn: () => getMerchantProduct(productId!),
    enabled: open,
    staleTime: 60_000,
  });

  React.useEffect(() => {
    if (open) setSelectedImg(0);
  }, [open, productId]);

  const images = product?.images ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        {isLoading || !product ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Skeleton className="aspect-square w-full" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="aspect-square w-full overflow-hidden rounded-md bg-gray-50">
                {images[selectedImg]?.media ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[selectedImg]!.media!.url} alt={product.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImg(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded border ${
                        i === selectedImg ? "border-primary" : "border-border"
                      }`}
                    >
                      {img.media && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.media.url} alt="" className="h-full w-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                {product.brand && (
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {product.brand.name}
                  </span>
                )}
                <DialogTitle className="text-xl font-semibold leading-tight text-foreground">{product.name}</DialogTitle>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{product.productCode}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={product.status} labelOverrides={PRODUCT_STATUS_LABELS} />
                {product.category && <Badge variant="default">{product.category.name}</Badge>}
              </div>

              <div>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(product.basePrice)}</p>
                {product.compareAtPrice ? (
                  <p className="text-sm text-muted-foreground line-through">{formatCurrency(product.compareAtPrice)}</p>
                ) : null}
              </div>

              {product.description && (
                <p className="line-clamp-4 text-sm text-muted-foreground">{product.description}</p>
              )}

              {product.variants && product.variants.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Variants</p>
                  <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
                    {product.variants.map((v) => (
                      <div key={v.id} className="flex items-center justify-between border-b border-border pb-1 text-xs last:border-0">
                        <span className="font-mono">{v.sku}</span>
                        <span className={v.inventory?.quantity === 0 ? "text-danger" : "text-muted-foreground"}>
                          {v.inventory?.quantity ?? 0} in stock
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={`/products/${product.id}/edit`}
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => onOpenChange(false)}
              >
                Edit full details →
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
