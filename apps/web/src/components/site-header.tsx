"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useAuthStore } from "../stores/auth-store";
import { useCart, useRemoveCartItem } from "../hooks/use-cart";
import { useWishlistProductIds } from "../hooks/use-wishlist";
import { formatPrice } from "../lib/format";
import type { Category } from "../types/catalog";

export function SiteHeader({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const [categoriesOpen, setCategoriesOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchCategoryId, setSearchCategoryId] = React.useState("");
  const categoriesMenuRef = React.useRef<HTMLDivElement>(null);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const customer = useAuthStore((s) => (hasHydrated ? s.customer : null));
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: cart } = useCart();
  const removeCartItem = useRemoveCartItem();
  const { data: wishlistIds } = useWishlistProductIds();
  const wishlistCount = wishlistIds?.size ?? 0;
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  React.useEffect(() => {
    if (!categoriesOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoriesOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchTerm.trim() && !searchCategoryId) return;
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (searchCategoryId) params.set("categoryId", searchCategoryId);
    router.push(`/search?${params.toString()}`);
    setMobileSearchOpen(false);
  }

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-foreground py-2 text-center text-xs text-background">
        Free shipping on orders above ₹999 &nbsp;|&nbsp; Use code{" "}
        <span className="font-semibold text-primary">WELCOME10</span> for 10% off your first order
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-background shadow-soft">
        {/* Main row */}
        <div className="mx-auto flex max-w-site items-center gap-4 px-gutter py-3">
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image src="/logo.png" alt="Mirakart" width={120} height={36} className="h-9 w-auto object-contain" priority />
          </Link>

          {/* Inline search bar — desktop */}
          <form
            onSubmit={handleSearch}
            className="ml-4 hidden flex-1 items-stretch overflow-hidden rounded border border-border bg-background-light lg:flex"
          >
            <div className="flex flex-1 items-center pl-4">
              <Search className="h-4 w-4 shrink-0 text-foreground-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your favorite product..."
                className="h-11 w-full bg-transparent px-3 text-sm text-foreground placeholder:text-foreground-muted outline-none"
              />
            </div>
            <div className="flex shrink-0 items-center border-l border-border">
              <select
                value={searchCategoryId}
                onChange={(e) => setSearchCategoryId(e.target.value)}
                aria-label="Select category"
                className="h-11 max-w-[11rem] cursor-pointer bg-transparent px-3 text-sm text-foreground-muted outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </form>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-1">
            {/* Mobile search toggle */}
            <button
              type="button"
              aria-label="Search"
              onClick={() => setMobileSearchOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded text-foreground transition-colors hover:text-primary lg:hidden"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Account */}
            <div className="group relative hidden sm:block">
              <button
                type="button"
                aria-label="Account"
                className="flex h-10 w-10 items-center justify-center rounded text-foreground transition-colors hover:text-primary"
              >
                <User className="h-5 w-5" />
              </button>
              <div className="invisible absolute right-0 top-full w-44 rounded border border-border bg-background shadow-soft transition-all group-hover:visible">
                {customer ? (
                  <>
                    <div className="border-b border-border px-4 py-2 text-xs text-foreground-muted">
                      Hi, {customer.firstName}
                    </div>
                    <Link href="/account/orders" className="block px-4 py-2 text-sm text-foreground hover:bg-background-light hover:text-primary">
                      My Orders
                    </Link>
                    <Link href="/account/profile" className="block px-4 py-2 text-sm text-foreground hover:bg-background-light hover:text-primary">
                      My Profile
                    </Link>
                    <Link href="/account/addresses" className="block px-4 py-2 text-sm text-foreground hover:bg-background-light hover:text-primary">
                      Addresses
                    </Link>
                    <button
                      onClick={() => clearAuth()}
                      className="block w-full border-t border-border px-4 py-2 text-left text-sm text-danger hover:bg-background-light"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-background-light hover:text-primary">
                      Sign In
                    </Link>
                    <Link href="/register" className="block border-t border-border px-4 py-2.5 text-sm text-foreground hover:bg-background-light hover:text-primary">
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Wishlist */}
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              className="relative hidden h-10 w-10 items-center justify-center rounded text-foreground transition-colors hover:text-primary sm:flex"
            >
              <Heart className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            </Link>

            {/* Cart */}
            <div className="group relative">
              <Link
                href="/cart"
                aria-label="Cart"
                className="flex h-10 items-center gap-2 rounded px-1 text-foreground transition-colors hover:text-primary"
              >
                {cart && cart.items.length > 0 && (
                  <span className="hidden text-sm font-semibold text-foreground sm:inline">
                    {formatPrice(cart.subtotal)}
                  </span>
                )}
                <span className="relative flex h-10 w-10 items-center justify-center">
                  <ShoppingBag className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </span>
              </Link>

              {/* Hover mini-cart */}
              {cart && cart.items.length > 0 && (
                <div className="invisible absolute right-0 top-full z-50 w-80 rounded border border-border bg-background opacity-0 shadow-soft transition-all group-hover:visible group-hover:opacity-100">
                  <div className="flex max-h-80 flex-col gap-4 overflow-y-auto p-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded bg-background-light">
                          {item.product.image ? (
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-border" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/p/${item.product.slug}`}
                            className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
                          >
                            {item.product.name}
                          </Link>
                          <p className="mt-1 text-xs text-foreground-muted">
                            {item.quantity} × {formatPrice(item.currentPrice)}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove item"
                          onClick={() => removeCartItem.mutate(item.id)}
                          className="shrink-0 text-foreground-muted hover:text-danger"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-muted">Subtotal:</span>
                      <span className="font-semibold text-primary">{formatPrice(cart.subtotal)}</span>
                    </div>
                    <p className="mt-1 text-xs text-foreground-muted">
                      You have {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      <Link href="/cart" className="btn-outline w-full text-center text-xs">
                        View cart
                      </Link>
                      <Link href="/checkout" className="btn-primary w-full text-center text-xs">
                        Checkout
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search row */}
        {mobileSearchOpen && (
          <div className="border-t border-border px-gutter py-3 lg:hidden">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your favorite product..."
                className="h-10 flex-1 rounded border border-border bg-background-light px-3 text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-foreground text-background"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Category nav row — desktop */}
        <div className="hidden border-t border-border lg:block">
          <div className="mx-auto flex max-w-site items-stretch px-gutter">
            {/* All Categories dropdown */}
            <div ref={categoriesMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setCategoriesOpen((o) => !o)}
                className="flex h-12 items-center gap-2 pr-5 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                All Categories
                {categories.length > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                    {categories.length}
                  </span>
                )}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 top-full z-50 max-h-96 w-64 overflow-y-auto rounded-b border border-t-0 border-border bg-background py-2 shadow-soft">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/c/${category.slug}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="block px-4 py-2 text-sm text-foreground transition-colors hover:bg-background-light hover:text-primary"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="h-12 w-px shrink-0 bg-border" />

            {/* Category nav links */}
            <nav className="flex h-12 items-center gap-1 pl-2">
              {categories.slice(0, 7).map((category) => (
                <Link
                  key={category.id}
                  href={`/c/${category.slug}`}
                  className="flex h-12 items-center border-b-2 border-transparent px-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {category.name}
                </Link>
              ))}
              {categories.length > 7 && (
                <button
                  type="button"
                  onClick={() => setCategoriesOpen(true)}
                  className="flex h-12 items-center gap-1 border-b-2 border-transparent px-3 text-sm font-medium text-foreground-muted transition-colors hover:border-primary hover:text-primary"
                >
                  More <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-72 overflow-y-auto bg-background">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Image src="/logo.png" alt="Mirakart" width={100} height={30} className="h-7 w-auto" />
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>

            {customer ? (
              <div className="border-b border-border bg-background-light px-5 py-3">
                <p className="text-sm font-medium text-foreground">Hi, {customer.firstName}</p>
                <p className="text-xs text-foreground-muted">{customer.email}</p>
              </div>
            ) : (
              <div className="flex gap-2 border-b border-border px-5 py-4">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 text-center text-xs">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-outline flex-1 text-center text-xs">
                  Register
                </Link>
              </div>
            )}

            <nav className="flex flex-col divide-y divide-border">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/c/${category.slug}`}
                  className="px-5 py-3.5 text-sm font-medium text-foreground hover:text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            {customer && (
              <div className="border-t border-border px-5 py-4">
                <button onClick={() => { clearAuth(); setMobileOpen(false); }} className="text-sm text-danger">
                  Sign Out
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 bg-foreground/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
