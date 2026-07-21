import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { formatPrice } from "../lib/format";
import { WishlistButton } from "./wishlist-button";
import type { ProductListItem } from "../types/catalog";

export function ProductCard({ product }: { product: ProductListItem }) {
  const image = product.images[0]?.media;
  const secondImage = product.images[1]?.media;
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
          {image ? (
            <>
              <Image
                src={image.url}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className={`object-cover transition-all duration-500 ease-theme ${isOutOfStock ? "opacity-50 grayscale" : secondImage ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
              />
              {secondImage && !isOutOfStock && (
                <Image
                  src={secondImage.url}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover opacity-0 transition-all duration-500 ease-theme group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-background-light">
              <ShoppingBag className="h-8 w-8 text-border" />
            </div>
          )}
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
        </div>

        {/* Quick Add */}
        <Link
          href={`/p/${product.slug}`}
          className="absolute bottom-0 left-0 right-0 z-10 translate-y-full bg-foreground py-2.5 text-center text-xs font-medium uppercase tracking-wider text-background opacity-0 transition-all duration-300 ease-theme hover:bg-primary group-hover:translate-y-0 group-hover:opacity-100"
        >
          Quick View
        </Link>
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
