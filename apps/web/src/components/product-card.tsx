import Image from "next/image";
import Link from "next/link";
import { Badge } from "@mirakart/ui";
import { formatPrice } from "../lib/format";
import type { ProductListItem } from "../types/catalog";

export function ProductCard({ product }: { product: ProductListItem }) {
  const image = product.images[0]?.media;
  const onSale = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.basePrice);

  return (
    <Link href={`/p/${product.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-background-light">
        {image ? (
          <Image
            src={image.url}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 ease-theme group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-foreground-muted">
            No image
          </div>
        )}
        {onSale ? (
          <Badge variant="success" className="absolute left-2.5 top-2.5">
            Sale
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        {product.brand ? <span className="text-xs text-foreground-muted">{product.brand.name}</span> : null}
        <h3 className="text-sm font-medium text-foreground line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-foreground">{formatPrice(product.basePrice)}</span>
          {onSale ? (
            <span className="text-sm text-foreground-muted line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
