"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@mirakart/ui";
import { useAuthStore } from "../../stores/auth-store";

const NAV_ITEMS = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/returns", label: "Returns" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const customer = useAuthStore((s) => s.customer);

  React.useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hasHydrated, isAuthenticated, pathname, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-site px-gutter py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-4">
          {customer && (
            <div className="flex items-center gap-3 rounded-md border border-border p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold uppercase text-white">
                {customer.firstName.slice(0, 2)}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-foreground-muted">Welcome back,</span>
                <span className="text-sm font-medium text-foreground">
                  {customer.firstName} {customer.lastName}
                </span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                  (item.href === "/account" ? pathname === "/account" : pathname.startsWith(item.href))
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-background-light"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
