"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@mirakart/ui";
import { Sidebar, MobileSidebar } from "../../components/sidebar";
import { useAuthStore } from "../../stores/auth-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { merchant, hasHydrated } = useAuthStore();

  React.useEffect(() => {
    if (!hasHydrated) return;
    if (!merchant) { router.replace("/login"); return; }
    if (merchant.status === "PENDING") { router.replace("/pending"); return; }
    if (merchant.status === "SUSPENDED" || merchant.status === "REJECTED") { router.replace("/login"); }
  }, [hasHydrated, merchant, router]);

  if (!hasHydrated) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner className="h-8 w-8 text-primary" /></div>;
  }
  if (!merchant || merchant.status !== "APPROVED") return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:flex lg:w-60 lg:flex-col lg:shrink-0">
        <Sidebar className="flex-1" />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-white px-4 lg:hidden">
          <MobileSidebar />
          <span className="font-semibold">Seller Center</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
