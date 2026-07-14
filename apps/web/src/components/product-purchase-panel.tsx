"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap, Check, Ruler, Share2 } from "lucide-react";
import { Button, toast } from "@mirakart/ui";
import { formatPrice } from "../lib/format";
import { useAddCartItem } from "../hooks/use-cart";
import { useAuthStore } from "../stores/auth-store";
import { TagList } from "./product-tabs";
import { WishlistButton } from "./wishlist-button";
import type { ProductDetail, ProductVariant } from "../types/catalog";

function variantAttributeMap(variant: ProductVariant): Record<string, string> {
  const map: Record<string, string> = {};
  for (const link of variant.attributeValues) {
    map[link.attributeValue.attribute.id] = link.attributeValue.id;
  }
  return map;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Out of Stock
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Only {stock} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      In Stock
    </span>
  );
}

export function ProductPurchasePanel({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const addToCart = useAddCartItem();
  const [quantity, setQuantity] = React.useState(1);
  const [addedFeedback, setAddedFeedback] = React.useState(false);

  const attributes = React.useMemo(() => {
    const byId = new Map<
      string,
      {
        id: string;
        name: string;
        type: string;
        values: Map<string, { id: string; value: string; colorHex: string | null }>;
      }
    >();
    for (const variant of product.variants) {
      for (const link of variant.attributeValues) {
        const attr = link.attributeValue.attribute;
        if (!byId.has(attr.id)) {
          byId.set(attr.id, {
            id: attr.id,
            name: attr.name,
            type: attr.type,
            values: new Map(),
          });
        }
        byId.get(attr.id)!.values.set(link.attributeValue.id, {
          id: link.attributeValue.id,
          value: link.attributeValue.value,
          colorHex: link.attributeValue.colorHex,
        });
      }
    }
    return [...byId.values()];
  }, [product.variants]);

  const [selected, setSelected] = React.useState<Record<string, string>>(() => {
    const defaultVariant =
      product.variants.find((v) => v.isDefault) ?? product.variants[0];
    return defaultVariant ? variantAttributeMap(defaultVariant) : {};
  });

  const matchedVariant = React.useMemo(() => {
    return product.variants.find((variant) => {
      const map = variantAttributeMap(variant);
      return attributes.every((attr) => map[attr.id] === selected[attr.id]);
    });
  }, [attributes, product.variants, selected]);

  const displayPrice = matchedVariant
    ? Number(matchedVariant.price)
    : Number(product.basePrice);
  const compareAtPrice = matchedVariant?.compareAtPrice
    ? Number(matchedVariant.compareAtPrice)
    : product.compareAtPrice
    ? Number(product.compareAtPrice)
    : null;
  const stock = matchedVariant?.inventory?.quantity ?? 0;
  const canAddToCart = Boolean(matchedVariant) && stock > 0;

  function handleAddToCart() {
    if (!isAuthenticated) {
      router.push(`/login?next=/p/${product.slug}`);
      return;
    }
    if (!matchedVariant) return;
    addToCart.mutate(
      { variantId: matchedVariant.id, quantity },
      {
        onSuccess: () => {
          setAddedFeedback(true);
          setTimeout(() => setAddedFeedback(false), 2000);
        },
      },
    );
  }

  async function handleShare() {
    const shareData = { title: product.name, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled the share sheet — no action needed
      }
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    toast({ title: "Link copied to clipboard", variant: "success" });
  }

  function handleBuyNow() {
    if (!isAuthenticated) {
      router.push(`/login?next=/p/${product.slug}`);
      return;
    }
    if (!matchedVariant) return;
    addToCart.mutate(
      { variantId: matchedVariant.id, quantity },
      { onSuccess: () => router.push("/checkout") },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-semibold text-foreground">
          {formatPrice(displayPrice)}
        </span>
        {compareAtPrice && compareAtPrice > displayPrice && (
          <>
            <span className="text-lg text-foreground-muted line-through">
              {formatPrice(compareAtPrice)}
            </span>
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {Math.round(((compareAtPrice - displayPrice) / compareAtPrice) * 100)}% OFF
            </span>
          </>
        )}
      </div>

      {/* Short description excerpt */}
      {product.description && (
        <p className="line-clamp-3 text-sm leading-relaxed text-foreground-muted">
          {product.description}
        </p>
      )}

      {/* Variant attributes */}
      {attributes.map((attribute, index) => {
        const isColor = attribute.type === "COLOR";
        const isLast = index === attributes.length - 1;
        return (
          <div key={attribute.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{attribute.name}</span>
              {selected[attribute.id] && (
                <span className="text-sm text-foreground-muted">
                  — {[...attribute.values.values()].find((v) => v.id === selected[attribute.id])?.value}
                </span>
              )}
              {isLast && Object.keys(selected).length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected({})}
                  className="ml-auto text-xs text-foreground-muted underline underline-offset-2 hover:text-primary"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {[...attribute.values.values()].map((value) => {
                const isSelected = selected[attribute.id] === value.id;
                if (isColor && value.colorHex) {
                  return (
                    <button
                      key={value.id}
                      type="button"
                      title={value.value}
                      onClick={() =>
                        setSelected((prev) => ({ ...prev, [attribute.id]: value.id }))
                      }
                      className={`relative h-9 w-9 rounded-full border-2 transition-all ${
                        isSelected
                          ? "border-foreground scale-110 shadow-md"
                          : "border-transparent hover:border-foreground-muted"
                      }`}
                      style={{ backgroundColor: value.colorHex }}
                    >
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white drop-shadow" />
                        </span>
                      )}
                      <span className="sr-only">{value.value}</span>
                    </button>
                  );
                }
                return (
                  <button
                    key={value.id}
                    type="button"
                    onClick={() =>
                      setSelected((prev) => ({ ...prev, [attribute.id]: value.id }))
                    }
                    className={`flex min-w-[2.75rem] items-center justify-center rounded border px-3 py-1.5 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:border-foreground"
                    }`}
                  >
                    {value.value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Stock status */}
      <div className="flex items-center gap-4">{matchedVariant && <StockBadge stock={stock} />}</div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground-muted">
            Tags
          </p>
          <TagList tags={product.tags} />
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground-muted">Qty</span>
        <div className="flex h-10 items-center rounded border border-border">
          <button
            type="button"
            className="flex h-full w-10 items-center justify-center text-foreground hover:bg-background-light transition-colors disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 select-none text-center text-sm font-medium text-foreground">
            {quantity}
          </span>
          <button
            type="button"
            className="flex h-full w-10 items-center justify-center text-foreground hover:bg-background-light transition-colors disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.min(stock || 99, q + 1))}
            disabled={!canAddToCart || quantity >= stock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          size="lg"
          className="flex w-full items-center justify-center gap-2"
          disabled={!canAddToCart}
          isLoading={addToCart.isPending}
          onClick={handleAddToCart}
        >
          {addedFeedback ? (
            <>
              <Check className="h-4 w-4" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              {matchedVariant
                ? stock > 0
                  ? "Add to Cart"
                  : "Out of Stock"
                : "Select Options"}
            </>
          )}
        </Button>

        <button
          type="button"
          disabled={!canAddToCart || addToCart.isPending}
          onClick={handleBuyNow}
          className="flex w-full items-center justify-center gap-2 rounded border border-foreground bg-transparent py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          <Zap className="h-4 w-4" />
          Buy Now
        </button>
      </div>

      {/* Extra buttons */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
        <button
          type="button"
          onClick={() => toast({ title: "Check the size chart in the product description", variant: "default" })}
          className="flex items-center gap-1.5 text-foreground-muted transition-colors hover:text-primary"
        >
          <Ruler className="h-3.5 w-3.5" />
          Size Guide
        </button>
        <span className="text-border">|</span>
        <WishlistButton productId={product.id} productSlug={product.slug} variant="text" />
        <span className="text-border">|</span>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 text-foreground-muted transition-colors hover:text-primary"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share this Product
        </button>
      </div>

      {/* SKU + Category meta */}
      <div className="flex flex-col gap-1 text-sm text-foreground-muted">
        {(matchedVariant?.sku ?? product.sku) && (
          <p>
            SKU: <span className="text-foreground">{matchedVariant?.sku ?? product.sku}</span>
          </p>
        )}
        {product.category && (
          <p>
            Category:{" "}
            <Link href={`/c/${product.category.slug}`} className="text-foreground hover:text-primary">
              {product.category.name}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
