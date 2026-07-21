"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button, EmptyState, Skeleton, StatusBadge } from "@mirakart/ui";
import { fetchOrders } from "../../../lib/api/orders";
import { formatPrice } from "../../../lib/format";

export default function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: () => fetchOrders() });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-medium text-foreground">My Orders</h1>
      {!data || data.data.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Your order history will show up here."
          action={
            <Button asChild>
              <Link href="/">Continue shopping</Link>
            </Button>
          }
        />
      ) : (
        data.data.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="flex flex-col gap-2 rounded-md border border-border p-4 transition-colors hover:border-primary sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
              <p className="text-xs text-foreground-muted">{new Date(order.placedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground">{formatPrice(order.total)}</span>
              <StatusBadge status={order.status} />
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
