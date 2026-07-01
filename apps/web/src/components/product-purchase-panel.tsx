"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mirakart/ui";
import { formatPrice } from "../lib/format";
import { useAddCartItem } from "../hooks/use-cart";
import { useAuthStore } from "../stores/auth-store";
import type { ProductDetail, ProductVariant } from "../types/catalog";

function variantAttributeMap(variant: ProductVariant): Record<string, string> {
  const map: Record<string, string> = {};
  for (const link of variant.attributeValues) {
    map[link.attributeValue.attribute.id] = link.attributeValue.id;
  }
  return map;
}

export function ProductPurchasePanel({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const addToCart = useAddCartItem();
  const [quantity, setQuantity] = React.useState(1);

  const attributes = React.useMemo(() => {
    const byId = new Map<string, { id: string; name: string; values: Map<string, { id: string; value: string; colorHex: string | null }> }>();
    for (const variant of product.variants) {
      for (const link of variant.attributeValues) {
        const attr = link.attributeValue.attribute;
        if (!byId.has(attr.id)) byId.set(attr.id, { id: attr.id, name: attr.name, values: new Map() });
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
    const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
    return defaultVariant ? variantAttributeMap(defaultVariant) : {};
  });

  const matchedVariant = React.useMemo(() => {
    return product.variants.find((variant) => {
      const map = variantAttributeMap(variant);
      return attributes.every((attr) => map[attr.id] === selected[attr.id]);
    });
  }, [attributes, product.variants, selected]);

  const price = matchedVariant ? Number(matchedVariant.price) : Number(product.basePrice);
  const stock = matchedVariant?.inventory?.quantity ?? 0;
  const canAddToCart = Boolean(matchedVariant) && stock > 0;

  function handleAddToCart() {
    if (!isAuthenticated) {
      router.push(`/login?next=/p/${product.slug}`);
      return;
    }
    if (!matchedVariant) return;
    addToCart.mutate({ variantId: matchedVariant.id, quantity });
  }

  return (
    <div className="flex flex-col gap-6">
      <span className="text-2xl font-medium text-foreground">{formatPrice(price)}</span>

      {attributes.map((attribute) => (
        <div key={attribute.id} className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">{attribute.name}</span>
          <div className="flex flex-wrap gap-2">
            {[...attribute.values.values()].map((value) => {
              const isSelected = selected[attribute.id] === value.id;
              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() => setSelected((prev) => ({ ...prev, [attribute.id]: value.id }))}
                  className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-sm border px-3 text-sm transition-colors ${
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-foreground"
                  }`}
                  style={value.colorHex ? { backgroundColor: isSelected ? undefined : value.colorHex } : undefined}
                >
                  {value.colorHex ? <span className="sr-only">{value.value}</span> : value.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4">
        <div className="flex h-form items-center rounded-sm border border-border-form">
          <button
            type="button"
            className="flex h-full w-10 items-center justify-center text-foreground"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            –
          </button>
          <span className="w-10 text-center text-sm">{quantity}</span>
          <button
            type="button"
            className="flex h-full w-10 items-center justify-center text-foreground"
            onClick={() => setQuantity((q) => Math.min(stock || 99, q + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          disabled={!canAddToCart}
          isLoading={addToCart.isPending}
          onClick={handleAddToCart}
        >
          {matchedVariant ? (stock > 0 ? "Add to Cart" : "Out of Stock") : "Select options"}
        </Button>
      </div>
    </div>
  );
}
