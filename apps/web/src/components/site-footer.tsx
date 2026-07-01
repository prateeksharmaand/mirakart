import Link from "next/link";
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
      {/* Feature Strip */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-site grid-cols-2 divide-x divide-border px-gutter md:grid-cols-4">
          {[
            { icon: "🚚", title: "Free Shipping", desc: "On orders above ₹999" },
            { icon: "↩️", title: "Easy Returns", desc: "30-day return policy" },
            { icon: "🔒", title: "Secure Payment", desc: "100% secure checkout" },
            { icon: "🎧", title: "24/7 Support", desc: "Dedicated support team" },
          ].map((feature) => (
            <div key={feature.title} className="flex items-center gap-3 px-6 py-5">
              <span className="text-2xl">{feature.icon}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{feature.title}</p>
                <p className="text-xs text-foreground-muted">{feature.desc}</p>
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
            <Link href="/" className="text-2xl font-bold tracking-tight text-foreground">
              Mirakart
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
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-foreground-muted">
            © {new Date().getFullYear()} Mirakart. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-foreground-muted hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-foreground-muted hover:text-foreground">Terms of Service</Link>
            <Link href="/sitemap" className="text-xs text-foreground-muted hover:text-foreground">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
