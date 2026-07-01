"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from "@mirakart/ui";
import { useAuthStore } from "../stores/auth-store";
import { useCart } from "../hooks/use-cart";
import type { Category } from "../types/catalog";

export function SiteHeader({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const customer = useAuthStore((s) => s.customer);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: cart } = useCart();
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-site items-center gap-6 px-gutter py-4">
        <button
          type="button"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link href="/" className="text-2xl font-medium text-foreground">
          Mirakart
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/c/${category.slug}`}
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="ml-auto hidden flex-1 max-w-sm items-center sm:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-4 sm:ml-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Account" className="text-foreground">
                <User className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {customer ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders">My orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile">My profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/addresses">Addresses</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => clearAuth()}>Sign out</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">Sign in</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">Create account</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/cart" className="relative text-foreground" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="left-0 top-0 h-full max-w-xs translate-x-0 translate-y-0 overflow-y-auto rounded-none p-0">
          <div className="border-b border-border p-5 text-lg font-medium">Menu</div>
          <nav className="flex flex-col p-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/c/${category.slug}`}
                className="border-b border-border py-3 text-sm text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </DialogContent>
      </Dialog>

      <div className="border-t border-border px-gutter py-3 sm:hidden">
        <form onSubmit={handleSearch} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="pl-9"
          />
        </form>
      </div>
    </header>
  );
}
