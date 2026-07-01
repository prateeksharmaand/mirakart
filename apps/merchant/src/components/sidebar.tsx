"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, RotateCcw, User, FileText, LogOut, Menu, X,
} from "lucide-react";
import { cn } from "@mirakart/ui";
import { useAuthStore } from "../stores/auth-store";
import { merchantLogout } from "../lib/api/auth";
import { toast } from "@mirakart/ui";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/returns", label: "Returns", icon: RotateCcw },
  { href: "/profile", label: "Store Profile", icon: User },
  { href: "/documents", label: "Documents", icon: FileText },
];

function NavLink({ item }: { item: { href: string; label: string; icon: React.ElementType } }) {
  const pathname = usePathname();
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;
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
  const { merchant, refreshToken, clearAuth } = useAuthStore();

  async function handleLogout() {
    try { if (refreshToken) await merchantLogout(refreshToken); } catch { /* swallow */ }
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className={cn("flex h-full flex-col bg-slate-900", className)}>
      <div className="flex h-16 items-center gap-2 px-5 border-b border-white/10">
        <span className="text-xl font-bold text-white">Mirakart</span>
        <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">Seller</span>
      </div>

      {merchant && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs text-slate-400">Store</p>
          <p className="text-sm font-semibold text-white truncate">{merchant.storeName}</p>
          <p className="text-xs text-slate-400 truncate">@{merchant.storeSlug}</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {NAV.map((item) => <NavLink key={item.href} item={item} />)}
      </nav>

      <div className="border-t border-white/10 p-3">
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
      <button onClick={() => setOpen(true)} className="lg:hidden p-2 text-slate-600" aria-label="Menu">
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 p-1 text-slate-400">
              <X className="h-5 w-5" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
}
