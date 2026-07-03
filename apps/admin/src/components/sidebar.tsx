"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Shield, Store, ShoppingBag, LayoutGrid,
  Tag, Sliders, Package, ShoppingCart, RotateCcw, Image, Settings,
  BarChart3, LogOut, Menu, X, ChevronDown,
} from "lucide-react";
import { cn } from "@mirakart/ui";
import { useAuthStore } from "../stores/auth-store";
import { adminLogout } from "../lib/api/auth";
import { toast } from "@mirakart/ui";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: { href: string; label: string }[];
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin-users", label: "Admin Users", icon: Users },
  { href: "/roles", label: "Roles & Permissions", icon: Shield },
  { href: "/merchants", label: "Merchants", icon: Store },
  { href: "/customers", label: "Customers", icon: ShoppingBag },
  {
    href: "/catalog",
    label: "Catalog",
    icon: LayoutGrid,
    children: [
      { href: "/categories", label: "Categories" },
      { href: "/brands", label: "Brands" },
      { href: "/attributes", label: "Attributes" },
      { href: "/tags", label: "Tags" },
    ],
  },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/returns", label: "Returns", icon: RotateCcw },
  { href: "/banners", label: "Banners", icon: Image },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const hasChildren = !!item.children?.length;
  const isActive = hasChildren
    ? item.children!.some((c) => pathname.startsWith(c.href))
    : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive ? "bg-primary/10 text-primary" : "text-slate-300 hover:bg-white/5 hover:text-white",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="mt-1 ml-7 flex flex-col gap-1">
            {item.children!.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  pathname.startsWith(c.href) ? "text-primary font-medium" : "text-slate-400 hover:text-white",
                )}
              >
                {c.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive ? "bg-primary/10 text-primary" : "text-slate-300 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const router = useRouter();
  const { admin, refreshToken, clearAuth } = useAuthStore();

  async function handleLogout() {
    try {
      if (refreshToken) await adminLogout(refreshToken);
    } catch { /* swallow */ }
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className={cn("flex h-full flex-col bg-slate-900", className)}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-5 border-b border-white/10">
        <span className="text-xl font-bold text-white">Mirakart</span>
        <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/10 p-3">
        {admin && (
          <div className="mb-2 px-3 py-2">
            <p className="text-sm font-medium text-white truncate">{admin.firstName} {admin.lastName}</p>
            <p className="text-xs text-slate-400 truncate">{admin.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
}
