"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge, Button, EmptyState, Skeleton } from "@mirakart/ui";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "../../hooks/use-cart";
import { useAuthStore } from "../../stores/auth-store";
import { formatPrice } from "../../lib/format";

export default function CartPage() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Sign in to view your cart"
        description="Your cart is saved to your account."
        action={
          <Button asChild>
            <Link href="/login?next=/cart">Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-site px-gutter py-10">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse our catalog to find something you'll love."
        action={
          <Button asChild>
            <Link href="/">Continue shopping</Link>
          </Button>
        }
      />
    );
  }

  const unavailableCount = cart.items.filter((item) => !item.isAvailable).length;

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <h1 className="mb-8 text-3xl font-medium text-foreground">Your Cart</h1>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-4 border-b border-border pb-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-background-light">
                {item.product.image ? (
                  <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/p/${item.product.slug}`} className="text-sm font-medium text-foreground hover:text-primary">
                      {item.product.name}
                    </Link>
                    {item.variant.attributeValues.length > 0 ? (
                      <p className="text-xs text-foreground-muted">
                        {item.variant.attributeValues.map((av) => `${av.attributeName}: ${av.value}`).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-sm font-medium text-foreground">{formatPrice(item.currentPrice)}</span>
                </div>

                {!item.isAvailable ? (
                  <Badge variant="danger" className="w-fit">
                    {item.availableStock === 0 ? "Out of stock" : "Limited stock"}
                  </Badge>
                ) : item.priceChanged ? (
                  <Badge variant="warning" className="w-fit">
                    Price updated
                  </Badge>
                ) : null}

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex h-9 items-center rounded-sm border border-border-form">
                    <button
                      type="button"
                      className="flex h-full w-8 items-center justify-center text-foreground"
                      onClick={() => updateItem.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                      aria-label="Decrease quantity"
                    >
                      –
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="flex h-full w-8 items-center justify-center text-foreground"
                      onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-foreground-muted hover:text-danger"
                    onClick={() => removeItem.mutate(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-border p-5 h-fit">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-muted">Subtotal</span>
            <span className="font-medium text-foreground">{formatPrice(cart.subtotal)}</span>
          </div>
          {unavailableCount > 0 ? (
            <p className="text-xs text-danger">
              {unavailableCount} item(s) are unavailable and won&apos;t be included at checkout.
            </p>
          ) : null}
          {cart.items.every((item) => !item.isAvailable) ? (
            <Button size="lg" disabled>
              Proceed to Checkout
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
