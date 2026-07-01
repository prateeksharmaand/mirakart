"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button, Skeleton, StatusBadge } from "@mirakart/ui";
import { fetchOrder, fetchOrderTracking } from "../../../../lib/api/orders";
import { formatPrice } from "../../../../lib/format";

export default function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", params.orderId],
    queryFn: () => fetchOrder(params.orderId),
  });
  const { data: tracking } = useQuery({
    queryKey: ["order-tracking", params.orderId],
    queryFn: () => fetchOrderTracking(params.orderId),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!order) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-foreground">{order.orderNumber}</h1>
          <p className="text-sm text-foreground-muted">{new Date(order.placedAt).toLocaleString()}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {tracking && tracking.history.length > 0 ? (
        <div className="rounded-md border border-border p-5">
          <h2 className="mb-4 text-sm font-medium text-foreground">Tracking</h2>
          <ol className="flex flex-col gap-4">
            {tracking.history.map((entry, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{entry.status}</p>
                  <p className="text-xs text-foreground-muted">{new Date(entry.changedAt).toLocaleString()}</p>
                  {entry.note ? <p className="text-xs text-foreground-muted">{entry.note}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">{item.productNameSnapshot}</p>
              {item.variantSnapshot.attributes.length > 0 ? (
                <p className="text-xs text-foreground-muted">
                  {item.variantSnapshot.attributes.map((a) => `${a.attributeName}: ${a.value}`).join(", ")}
                </p>
              ) : null}
              <p className="text-xs text-foreground-muted">Qty: {item.quantity}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground">{formatPrice(item.totalPrice)}</span>
              <StatusBadge status={item.status} />
              {item.status === "DELIVERED" ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/account/returns/new/${item.id}`}>Return</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="ml-auto flex w-full max-w-xs flex-col gap-2 rounded-md border border-border p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground-muted">Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground-muted">Shipping</span>
          <span>{formatPrice(order.shippingFee)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-medium">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
