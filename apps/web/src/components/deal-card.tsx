import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { formatPrice } from "../lib/format";
import { WishlistButton } from "./wishlist-button";
import { CountdownTimer } from "./countdown-timer";
import type { DealProduct } from "../lib/api/catalog";

export function DealCard({ deal }: { deal: DealProduct }) {
  const image = deal.images[0]?.media;
  const onSale = deal.compareAtPrice && Number(deal.compareAtPrice) > Number(deal.basePrice);
  const discount = onSale
    ? Math.round(((Number(deal.compareAtPrice) - Number(deal.basePrice)) / Number(deal.compareAtPrice)) * 100)
    : 0;
  const total = deal.soldCount + deal.availableCount;
  const soldPct = total > 0 ? Math.min(100, Math.round((deal.soldCount / total) * 100)) : 0;

  return (
    <div className="flex flex-col gap-5 border border-border p-5 sm:flex-row">
      {/* Image */}
      <Link
        href={`/p/${deal.slug}`}
        className="relative block h-64 w-full shrink-0 overflow-hidden bg-background-light sm:h-auto sm:w-52"
      >
        {image ? (
          <Image src={image.url} alt={deal.name} fill sizes="(min-width: 640px) 208px, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-border" />
          </div>
        )}
        {onSale && (
          <span className="absolute left-2.5 top-2.5 rounded bg-background px-1.5 py-0.5 text-[11px] font-semibold text-foreground shadow-soft">
            {discount}%
          </span>
        )}
        <div className="absolute right-2.5 top-2.5">
          <WishlistButton productId={deal.id} productSlug={deal.slug} />
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2">
        <Link href={`/p/${deal.slug}`} className="text-base font-semibold text-foreground hover:text-primary">
          {deal.name}
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-foreground">{formatPrice(deal.basePrice)}</span>
          {onSale && (
            <span className="text-sm text-foreground-muted line-through">{formatPrice(deal.compareAtPrice!)}</span>
          )}
        </div>

        {deal.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <span className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.round(deal.averageRating) ? "fill-primary text-primary" : "text-border"}`}
                />
              ))}
            </span>
            {deal.reviewCount} {deal.reviewCount === 1 ? "review" : "reviews"}
          </div>
        )}

        <p className="line-clamp-2 text-xs leading-relaxed text-foreground-muted">{deal.description}</p>

        <div className="mt-1">
          <p className="mb-2 text-xs font-medium text-foreground-muted">Offer ends in:</p>
          <CountdownTimer endsAt={deal.dealEndsAt} />
        </div>

        {total > 0 && (
          <div className="mt-1 flex flex-col gap-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-light">
              <div className="h-full rounded-full bg-primary" style={{ width: `${soldPct}%` }} />
            </div>
            <p className="text-xs text-foreground-muted">
              Available: {deal.availableCount} · Sold: <span className="font-semibold text-primary">{deal.soldCount}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
