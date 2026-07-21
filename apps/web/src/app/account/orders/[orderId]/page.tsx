"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Skeleton, StatusBadge, toast } from "@mirakart/ui";
import { OrderTimeline } from "../../../../components/order-timeline";
import { cancelOrder, fetchOrder, fetchOrderTracking } from "../../../../lib/api/orders";
import { formatPrice } from "../../../../lib/format";

const ORDER_CANCELLABLE_STATUSES = ["PENDING_CONFIRMATION", "CONFIRMED"];

export default function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", params.orderId],
    queryFn: () => fetchOrder(params.orderId),
  });
  const { data: tracking } = useQuery({
    queryKey: ["order-tracking", params.orderId],
    queryFn: () => fetchOrderTracking(params.orderId),
  });

  async function handleCancel() {
    try {
      await cancelOrder(params.orderId);
      queryClient.invalidateQueries({ queryKey: ["order", params.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Order cancelled", variant: "success" });
    } catch (error) {
      toast({ title: "Couldn't cancel order", description: (error as Error).message, variant: "danger" });
    }
  }

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

      <div className="rounded-md border border-border p-5">
        <h2 className="mb-4 text-sm font-medium text-foreground">Order Status</h2>
        <OrderTimeline status={order.status} history={tracking?.history} />
      </div>

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

      {order.cancelReason ? (
        <p className="text-sm text-danger">Cancellation reason: {order.cancelReason}</p>
      ) : null}

      {ORDER_CANCELLABLE_STATUSES.includes(order.status) ? (
        <Button variant="outline" className="w-fit" onClick={handleCancel}>
          Cancel order
        </Button>
      ) : null}
    </div>
  );
}
