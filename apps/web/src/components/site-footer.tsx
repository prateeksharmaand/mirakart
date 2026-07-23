"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

import type { Category } from "../types/catalog";

export function SiteFooter({ categories = [] }: { categories?: Category[] }) {
  return (
    <footer>
      {/* Dark Newsletter + Support + App Download Strip */}
      <div className="bg-foreground text-background">
        <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-gutter py-12 text-center md:grid-cols-2 md:gap-20">
          {/* Newsletter */}
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-semibold leading-snug text-background sm:text-2xl">
              Get our emails for info on<br />new items, sales and more.
            </h3>
            <p className="mt-2 text-sm text-background/60">
              We'll email you a voucher worth ₹100 off your first order above ₹999.
            </p>
            <form className="mt-5 flex w-full max-w-md" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email address"
                className="h-12 flex-1 border border-background/20 bg-background px-4 text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="h-12 shrink-0 bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-primary hover:text-white"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-3 text-xs text-background/40">
              By subscribing you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy &amp; Cookies Policy</Link>.
            </p>
          </div>

          {/* Support + App Download */}
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-background/60">Need help?</p>
            <p className="mt-1 text-3xl font-bold text-background">+91 98765 43210</p>
            <p className="mt-1 text-sm text-background/60">We are available 8:00am – 7:00pm</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href="#" aria-label="Download on App Store">
                <Image src="/app-store.png" alt="App Store" width={130} height={40} className="h-10 w-auto rounded border border-background/20 object-contain" />
              </Link>
              <Link href="#" aria-label="Get it on Google Play">
                <Image src="/google-play.png" alt="Google Play" width={130} height={40} className="h-10 w-auto rounded border border-background/20 object-contain" />
              </Link>
            </div>
            <p className="mt-3 max-w-sm text-xs text-background/40">
              <span className="font-semibold text-background/60">Shopping App:</span>{" "}
              Try our View in Your Room feature, manage registries and save payment info.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer — matches Clotya screenshot */}
      <div className="bg-background">
        <div className="mx-auto max-w-site px-gutter py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/">
                <Image src="/logo.png" alt="Mirakart" width={130} height={40} className="h-10 w-auto object-contain" />
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-primary">
                Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel
                facilisis in{" "}
                <Link href="/terms" className="underline">termapol</Link>.
              </p>
              <p className="mt-4 text-sm text-foreground-muted">
                +91 8890547456 — support@mirakart.com
              </p>
              <div className="mt-5 flex items-center gap-3">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Instagram, label: "Instagram" },
                  { icon: Twitter, label: "Twitter" },
                  { icon: Youtube, label: "YouTube" },
                ].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Information */}
            <div>
              <h4 className="mb-4 text-sm font-bold text-foreground">Information</h4>
              <ul className="space-y-3">
                {[
                  { label: "About Us", href: "/about" },
                  { label: "Returns Policy", href: "/returns" },
                  { label: "Dropshipping", href: "/dropshipping" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-primary hover:text-foreground">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="mb-4 text-sm font-bold text-foreground">Account</h4>
              <ul className="space-y-3">
                {[
                  { label: "Dashboard", href: "/account/profile" },
                  { label: "My Orders", href: "/account/orders" },
                  { label: "My Wishlist", href: "/account/wishlist" },
                  { label: "Account details", href: "/account/profile" },
                  { label: "Track My Orders", href: "/account/orders" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-primary hover:text-foreground">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop */}
            <div>
              <h4 className="mb-4 text-sm font-bold text-foreground">Shop</h4>
              <ul className="space-y-3">
                {[
                  { label: "Affiliate", href: "#" },
                  { label: "Bestsellers", href: "/search?sort=popular" },
                  { label: "Discount", href: "/search?sale=true" },
                  { label: "Latest Products", href: "/search?sort=newest" },
                  { label: "Sale Products", href: "/search?sale=true" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-primary hover:text-foreground">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <h4 className="mb-4 text-sm font-bold text-foreground">Categories</h4>
                <ul className="space-y-3">
                  {categories.slice(0, 5).map((cat) => (
                    <li key={cat.id}>
                      <Link href={`/c/${cat.slug}`} className="text-sm text-primary hover:text-foreground">
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-site flex-col items-center justify-between gap-4 px-gutter py-5 sm:flex-row">
            <p className="text-xs text-foreground-muted">
              Copyright {new Date().getFullYear()} © Mirakart. All right reserved.
            </p>
            <Image
              src="/payment-cards.png"
              alt="Accepted payment methods"
              width={220}
              height={24}
              className="h-5 w-auto object-contain opacity-80"
            />
            <div className="flex items-center gap-5">
              <Link href="/terms" className="text-xs text-foreground-muted hover:text-foreground">Terms and Conditions</Link>
              <Link href="/returns" className="text-xs text-foreground-muted hover:text-foreground">Returns Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
