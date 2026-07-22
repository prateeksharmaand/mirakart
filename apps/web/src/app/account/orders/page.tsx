"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
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
        data.data.map((order) => {
          const firstItem = order.items[0];
          const image = firstItem?.product?.images[0]?.media.url;
          return (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex flex-col gap-3 rounded-md border border-border p-4 transition-colors hover:border-primary sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-background-light">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-border" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                  {firstItem?.product?.productCode && (
                    <p className="text-xs text-foreground-muted">{firstItem.product.productCode}</p>
                  )}
                  <p className="text-xs text-foreground-muted">{new Date(order.placedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {order.payment && (
                  <div className="flex flex-col items-end gap-1 text-xs text-foreground-muted">
                    <span>{order.payment.method === "COD" ? "Cash on Delivery" : "Online"}</span>
                    <StatusBadge status={order.payment.status} />
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">{formatPrice(order.total)}</span>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
