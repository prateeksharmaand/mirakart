import Link from "next/link";
import { Separator } from "@mirakart/ui";

const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All Categories", href: "/" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My Orders", href: "/account/orders" },
      { label: "Addresses", href: "/account/addresses" },
      { label: "Returns", href: "/account/returns" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Create Account", href: "/register" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background-light">
      <div className="mx-auto max-w-site px-gutter py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="text-2xl font-medium text-foreground">
              Mirakart
            </Link>
            <p className="mt-3 text-sm text-foreground-muted">Shop from thousands of verified sellers.</p>
          </div>
          {FOOTER_LINKS.map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-medium text-foreground">{column.title}</h4>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-foreground-muted hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <p className="text-xs text-foreground-muted">© {new Date().getFullYear()} Mirakart. All rights reserved.</p>
      </div>
    </footer>
  );
}
