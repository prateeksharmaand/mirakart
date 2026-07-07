"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useAuthStore } from "../stores/auth-store";
import { useCart } from "../hooks/use-cart";
import type { Category } from "../types/catalog";

export function SiteHeader({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const customer = useAuthStore((s) => (hasHydrated ? s.customer : null));
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: cart } = useCart();
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchOpen(false);
      setSearchTerm("");
    }
  }

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-foreground py-2 text-center text-xs text-background">
        Free shipping on orders above ₹999 &nbsp;|&nbsp; Use code{" "}
        <span className="font-semibold text-primary">WELCOME10</span> for 10% off your first order
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background shadow-soft">
        <div className="mx-auto flex max-w-site items-center gap-4 px-gutter py-3 lg:py-0">
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

          {/* Desktop Category Nav */}
          <nav className="ml-6 hidden h-full items-center gap-1 lg:flex">
            {categories.slice(0, 7).map((category) => (
              <Link
                key={category.id}
                href={`/c/${category.slug}`}
                className="flex h-14 items-center border-b-2 border-transparent px-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
            {categories.length > 7 && (
              <button
                type="button"
                className="flex h-14 items-center gap-1 border-b-2 border-transparent px-3 text-sm font-medium text-foreground-muted transition-colors hover:border-primary hover:text-primary"
              >
                More <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
          </nav>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-1">
            {/* Search toggle */}
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded text-foreground transition-colors hover:text-primary"
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
              className="hidden h-10 w-10 items-center justify-center rounded text-foreground transition-colors hover:text-primary sm:flex"
            >
              <Heart className="h-5 w-5" />
            </Link>

            {/* Cart */}
            <Link href="/cart" aria-label="Cart" className="relative flex h-10 w-10 items-center justify-center rounded text-foreground transition-colors hover:text-primary">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Fullscreen Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/80 pt-24 backdrop-blur-sm">
          <div className="w-full max-w-xl px-gutter">
            <form onSubmit={handleSearch} className="relative">
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for products, brands..."
                className="h-14 w-full rounded border-0 bg-background pl-5 pr-14 text-base text-foreground outline-none placeholder:text-foreground-muted"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-primary">
                <Search className="h-5 w-5" />
              </button>
            </form>
            <p className="mt-3 text-center text-xs text-background/60">Press Enter to search or</p>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="absolute right-4 top-4 text-background hover:text-primary"
            aria-label="Close search"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

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
