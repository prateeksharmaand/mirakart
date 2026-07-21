"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mirakart/ui";
import { fetchOrders } from "../../lib/api/orders";
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
  const { data, isLoading } = useQuery({ queryKey: ["orders", "overview"], queryFn: () => fetchOrders(1, 100) });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const orders = data?.data ?? [];
  const pendingConfirmation = orders.filter((o) => PENDING_CONFIRMATION_STATUSES.includes(o.status)).length;
  const current = orders.filter((o) => CURRENT_STATUSES.includes(o.status)).length;
  const completed = orders.filter((o) => COMPLETED_STATUSES.includes(o.status)).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium text-foreground">Account Overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard href="/account/orders" label="Pending Confirmation" count={pendingConfirmation} />
        <SummaryCard href="/account/orders" label="Current Orders" count={current} />
        <SummaryCard href="/account/orders" label="Completed Orders" count={completed} />
      </div>
    </div>
  );
}
