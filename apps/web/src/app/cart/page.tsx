"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Badge, Button, EmptyState, Skeleton, toast } from "@mirakart/ui";
import { CheckoutSteps } from "../../components/checkout-steps";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "../../hooks/use-cart";
import { useAuthStore } from "../../stores/auth-store";
import { formatPrice } from "../../lib/format";

const FREE_SHIPPING_THRESHOLD = 999;

export default function CartPage() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const { data: cart, isLoading, refetch, isRefetching } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const [couponCode, setCouponCode] = React.useState("");

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
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cart.subtotal);
  const freeShippingProgress = Math.min(100, (cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    toast({ title: "Coupon codes aren't available yet", description: "Check back soon!" });
  }

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <CheckoutSteps current="cart" />
      <h1 className="mb-8 text-3xl font-medium text-foreground">Your Cart</h1>

      {/* Free shipping progress */}
      <div className="mb-8 rounded-md border border-border p-4">
        <p className="mb-2.5 text-sm text-foreground">
          {remainingForFreeShipping > 0 ? (
            <>
              Add <span className="font-semibold text-primary">{formatPrice(remainingForFreeShipping)}</span> to
              cart and get free shipping!
            </>
          ) : (
            <>
              You&apos;ve unlocked <span className="font-semibold text-primary">free shipping</span>!
            </>
          )}
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-light">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          {/* Table header — desktop only */}
          <div className="hidden border-b border-border pb-3 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-4">
            <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">Product</span>
            <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">Price</span>
            <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">Quantity</span>
            <span className="text-right text-xs font-medium uppercase tracking-wider text-foreground-muted">Subtotal</span>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-center sm:gap-4"
              >
                {/* Product */}
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-background-light">
                    {item.product.image ? (
                      <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                    ) : null}
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => removeItem.mutate(item.id)}
                      className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white shadow-soft transition-transform hover:scale-110"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div>
                    <Link
                      href={`/p/${item.product.slug}`}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {item.product.name}
                    </Link>
                    {item.variant.attributeValues.length > 0 ? (
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        {item.variant.attributeValues.map((av) => `${av.attributeName}: ${av.value}`).join(", ")}
                      </p>
                    ) : null}
                    {!item.isAvailable ? (
                      <Badge variant="danger" className="mt-1.5 w-fit">
                        {item.availableStock === 0 ? "Out of stock" : "Limited stock"}
                      </Badge>
                    ) : item.priceChanged ? (
                      <Badge variant="warning" className="mt-1.5 w-fit">
                        Price updated
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between sm:block">
                  <span className="text-xs text-foreground-muted sm:hidden">Price</span>
                  <span className="text-sm text-foreground">{formatPrice(item.currentPrice)}</span>
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between sm:block">
                  <span className="text-xs text-foreground-muted sm:hidden">Quantity</span>
                  <div className="flex h-9 w-fit items-center rounded-sm border border-border-form">
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
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between sm:block sm:text-right">
                  <span className="text-xs text-foreground-muted sm:hidden">Subtotal</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatPrice(item.currentPrice * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon + update cart */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <div className="flex w-full max-w-sm gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code"
                className="h-10 flex-1 rounded-sm border border-border-form bg-background px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="h-10 shrink-0 rounded-sm bg-background-light px-4 text-sm font-medium text-foreground transition-colors hover:bg-border"
              >
                Apply coupon
              </button>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-10 shrink-0 rounded-sm bg-background-light px-4 text-sm font-medium text-foreground transition-colors hover:bg-border disabled:opacity-50"
            >
              {isRefetching ? "Updating…" : "Update cart"}
            </button>
          </div>
        </div>

        {/* Cart totals */}
        <div className="flex flex-col gap-4 rounded-md border border-border p-5 h-fit">
          <h2 className="text-base font-medium text-foreground">Cart totals</h2>
          <div className="flex flex-col divide-y divide-border">
            <div className="flex items-center justify-between py-3 text-sm">
              <span className="text-foreground-muted">Subtotal</span>
              <span className="text-foreground">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <span className="text-foreground-muted">Shipping</span>
              <span className="text-foreground">
                {remainingForFreeShipping === 0 ? "Free" : "Calculated at checkout"}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="text-lg font-semibold text-foreground">{formatPrice(cart.subtotal)}</span>
            </div>
          </div>
          {unavailableCount > 0 ? (
            <p className="text-xs text-danger">
              {unavailableCount} item(s) are unavailable and won&apos;t be included at checkout.
            </p>
          ) : null}
          {cart.items.every((item) => !item.isAvailable) ? (
            <Button size="lg" disabled>
              Proceed to checkout
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/checkout">Proceed to checkout</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
