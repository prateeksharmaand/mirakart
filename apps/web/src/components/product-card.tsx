import Link from "next/link";
import { Star } from "lucide-react";
import { formatPrice } from "../lib/format";
import { WishlistButton } from "./wishlist-button";
import { QuickAddButton } from "./quick-add-button";
import { QuickViewButton } from "./quick-view-button";
import { HoverImageSlider } from "./hover-image-slider";
import type { ProductListItem } from "../types/catalog";

export function ProductCard({ product }: { product: ProductListItem }) {
  const images = product.images.map((img) => img.media);
  const onSale = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.basePrice);
  const discount = onSale
    ? Math.round(((Number(product.compareAtPrice) - Number(product.basePrice)) / Number(product.compareAtPrice)) * 100)
    : 0;
  const isOutOfStock = product.availableCount === 0;

  return (
    <div className="group relative flex flex-col">
      {/* Image Container */}
      <div className="relative block aspect-[3/4] w-full overflow-hidden rounded-sm bg-background-light">
        <Link href={`/p/${product.slug}`} className="absolute inset-0 z-0" aria-label={product.name}>
          <HoverImageSlider images={images} alt={product.name} isOutOfStock={isOutOfStock} />
        </Link>

        {/* Badges */}
        {isOutOfStock ? (
          <div className="pointer-events-none absolute left-2.5 top-2.5 z-10">
            <span className="rounded bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
              Out of Stock
            </span>
          </div>
        ) : (
          onSale && (
            <div className="pointer-events-none absolute left-2.5 top-2.5 z-10">
              <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                -{discount}%
              </span>
            </div>
          )
        )}

        {/* Hover Actions */}
        <div className="absolute right-2.5 top-2.5 z-10 flex translate-x-8 flex-col gap-2 opacity-0 transition-all duration-300 ease-theme group-hover:translate-x-0 group-hover:opacity-100">
          <WishlistButton productId={product.id} productSlug={product.slug} />
          <QuickViewButton productSlug={product.slug} />
        </div>

        {/* Quick Add */}
        <QuickAddButton
          productSlug={product.slug}
          singleVariantId={product.singleVariantId}
          variantCount={product.variantCount}
          isOutOfStock={isOutOfStock}
        />
      </div>

      {/* Info */}
      <div className="mt-3 flex flex-col gap-1 px-0.5">
        {(product.brand || product.reviewCount > 0) && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] uppercase tracking-wider text-foreground-muted">
              {product.brand?.name}
            </span>
            {product.reviewCount > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-[11px] text-foreground-muted">
                <Star className="h-3 w-3 fill-primary text-primary" />
                {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
              </span>
            )}
          </div>
        )}
        <Link href={`/p/${product.slug}`} className="text-sm font-medium leading-snug text-foreground line-clamp-2 hover:text-primary">
          {product.name}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{formatPrice(product.basePrice)}</span>
          {onSale && (
            <span className="text-xs text-foreground-muted line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
