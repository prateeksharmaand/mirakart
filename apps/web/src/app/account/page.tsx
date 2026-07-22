"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mirakart/ui";
import { fetchOrders } from "../../lib/api/orders";
import { useAuthStore } from "../../stores/auth-store";
import type { OrderStatus } from "../../types/order";

const PENDING_CONFIRMATION_STATUSES: OrderStatus[] = ["PENDING", "PENDING_CONFIRMATION"];
const CURRENT_STATUSES: OrderStatus[] = ["CONFIRMED", "ACCEPTED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const COMPLETED_STATUSES: OrderStatus[] = ["COMPLETED"];

function SummaryCard({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link href={href} className="flex flex-col gap-1 rounded-md border border-border p-5 transition-colors hover:border-primary">
      <span className="text-2xl font-semibold text-foreground">{count}</span>
      <span className="text-sm text-foreground-muted">{label}</span>
    </Link>
  );
}

export default function AccountOverviewPage() {
  const customer = useAuthStore((s) => s.customer);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data, isLoading } = useQuery({ queryKey: ["orders", "overview"], queryFn: () => fetchOrders(1, 100) });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const orders = data?.data ?? [];
  const pendingConfirmation = orders.filter((o) => PENDING_CONFIRMATION_STATUSES.includes(o.status)).length;
  const current = orders.filter((o) => CURRENT_STATUSES.includes(o.status)).length;
  const completed = orders.filter((o) => COMPLETED_STATUSES.includes(o.status)).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium text-foreground">Account Overview</h1>
      {customer && (
        <p className="text-sm text-foreground-muted">
          Hello <span className="font-semibold text-foreground">{customer.firstName} {customer.lastName}</span> (not
          you? <button type="button" onClick={() => clearAuth()} className="text-primary hover:underline">Log out</button>)
          <br />
          From your account overview you can view your{" "}
          <Link href="/account/orders" className="text-primary hover:underline">recent orders</Link>, manage your{" "}
          <Link href="/account/addresses" className="text-primary hover:underline">shipping and billing addresses</Link>,
          and edit your{" "}
          <Link href="/account/profile" className="text-primary hover:underline">password and profile details</Link>.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard href="/account/orders" label="Pending Confirmation" count={pendingConfirmation} />
        <SummaryCard href="/account/orders" label="Current Orders" count={current} />
        <SummaryCard href="/account/orders" label="Completed Orders" count={completed} />
      </div>
    </div>
  );
}
