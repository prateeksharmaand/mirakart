"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
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
        {order.items.map((item) => {
          const image = item.product?.images[0]?.media.url;
          return (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-background-light">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-border" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.productNameSnapshot}</p>
                  <p className="text-xs text-foreground-muted">
                    {[item.product?.productCode, item.product?.brand?.name].filter(Boolean).join(" · ")}
                  </p>
                  {item.variantSnapshot.attributes.length > 0 ? (
                    <p className="text-xs text-foreground-muted">
                      {item.variantSnapshot.attributes.map((a) => `${a.attributeName}: ${a.value}`).join(", ")}
                    </p>
                  ) : null}
                  <p className="text-xs text-foreground-muted">Qty: {item.quantity}</p>
                </div>
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
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {order.shippingAddress && (
          <div className="rounded-md border border-border p-5 text-sm">
            <h2 className="mb-3 text-sm font-medium text-foreground">Shipping Address</h2>
            <p className="text-foreground">{order.shippingAddress.fullName}</p>
            <p className="text-foreground-muted">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
            </p>
            <p className="text-foreground-muted">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
            <p className="text-foreground-muted">{order.shippingAddress.country}</p>
            <p className="text-foreground-muted">{order.shippingAddress.phone}</p>
          </div>
        )}
        {order.payment && (
          <div className="rounded-md border border-border p-5 text-sm">
            <h2 className="mb-3 text-sm font-medium text-foreground">Payment</h2>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Method</span>
              <span className="text-foreground">{order.payment.method === "COD" ? "Cash on Delivery" : "Online"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-foreground-muted">Status</span>
              <StatusBadge status={order.payment.status} />
            </div>
          </div>
        )}
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
