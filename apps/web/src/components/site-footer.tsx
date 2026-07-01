import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";

const SHOP_LINKS = [
  { label: "New Arrivals", href: "/search?sort=newest" },
  { label: "Best Sellers", href: "/search?sort=popular" },
  { label: "Sale", href: "/search?sale=true" },
  { label: "All Products", href: "/search" },
  { label: "Brands", href: "/brands" },
];

const HELP_LINKS = [
  { label: "Track Order", href: "/account/orders" },
  { label: "Returns & Exchanges", href: "/account/returns" },
  { label: "Shipping Policy", href: "/shipping" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];

const ACCOUNT_LINKS = [
  { label: "My Account", href: "/account/profile" },
  { label: "My Orders", href: "/account/orders" },
  { label: "My Addresses", href: "/account/addresses" },
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "Sign In", href: "/login" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background-light">
      {/* Feature Strip — Clotya style with outline SVG icons */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-site grid-cols-2 divide-x divide-border md:grid-cols-4">
          {[
            {
              title: "Free Shipping",
              desc: "Free shipping for orders above ₹999.",
              icon: (
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10 text-foreground">
                  <rect x="4" y="14" width="28" height="20" rx="2" />
                  <path d="M32 18h6l6 8v8h-12V18z" />
                  <circle cx="13" cy="36" r="3" />
                  <circle cx="37" cy="36" r="3" />
                  <path d="M8 22h14M8 27h10" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              title: "Money Guarantee",
              desc: "Within 30 days for an exchange.",
              icon: (
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10 text-foreground">
                  <rect x="6" y="10" width="28" height="28" rx="14" />
                  <path d="M34 10c0 0 8 4 8 14s-8 14-8 14" strokeLinecap="round" />
                  <path d="M20 18v2m0 8v2" strokeLinecap="round" />
                  <path d="M17 20.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5c0 1.3-1 2-3 2.5-2 .5-3 1.2-3 2.5C17 27 18.3 28 20 28s3-1 3-2.5" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              title: "Online Support",
              desc: "24/7 dedicated support team.",
              icon: (
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10 text-foreground">
                  <path d="M10 28c-2-3-3-6-3-10C7 11 14.3 4 24 4s17 7.2 17 14c0 7.7-7.6 14-17 14-2 0-3.8-.3-5.5-.9L8 34l2-6z" strokeLinejoin="round" />
                  <rect x="18" y="16" width="12" height="8" rx="2" />
                  <path d="M18 18h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2M30 18h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
                </svg>
              ),
            },
            {
              title: "Flexible Payment",
              desc: "Pay with multiple credit cards.",
              icon: (
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10 text-foreground">
                  <rect x="4" y="12" width="40" height="28" rx="3" />
                  <path d="M4 20h40" strokeLinecap="round" />
                  <path d="M10 28h8M10 33h5" strokeLinecap="round" />
                  <rect x="32" y="26" width="8" height="10" rx="1" />
                </svg>
              ),
            },
          ].map((feature) => (
            <div key={feature.title} className="flex items-center gap-4 px-6 py-6">
              <div className="shrink-0">{feature.icon}</div>
              <div>
                <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-primary">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-site px-gutter py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/">
              <Image src="/logo.png" alt="Mirakart" width={130} height={40} className="h-10 w-auto object-contain" />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground-muted">
              Your trusted multi-vendor marketplace for fashion, lifestyle, and more. Shop from thousands of verified sellers.
            </p>

            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <Mail className="h-4 w-4 shrink-0" />
                <span>support@mirakart.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Mumbai, Maharashtra, India</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              {[
                { icon: Facebook, label: "Facebook", href: "#" },
                { icon: Instagram, label: "Instagram", href: "#" },
                { icon: Twitter, label: "Twitter", href: "#" },
                { icon: Youtube, label: "YouTube", href: "#" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">Shop</h4>
            <ul className="space-y-2">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-foreground-muted transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">Help</h4>
            <ul className="space-y-2">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-foreground-muted transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">Account</h4>
            <ul className="space-y-2">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-foreground-muted transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-10 rounded-md border border-border bg-background p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-base font-medium text-foreground">Subscribe to our newsletter</h4>
              <p className="mt-1 text-sm text-foreground-muted">Get exclusive deals, new arrivals and style tips.</p>
            </div>
            <form className="flex w-full max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address"
                className="h-form flex-1 rounded border border-border bg-background-light px-4 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-border-form-active"
              />
              <button type="submit" className="btn-primary shrink-0 px-5">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-foreground-muted">
            © {new Date().getFullYear()} Mirakart. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-foreground-muted hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-foreground-muted hover:text-foreground">Terms of Service</Link>
          </div>
          <Image src="/payment-cards.png" alt="Accepted payment methods" width={220} height={24} className="h-6 w-auto object-contain opacity-70" />
        </div>
      </div>
    </footer>
  );
}
