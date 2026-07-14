"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Button, Skeleton } from "@mirakart/ui";
import { CheckoutSteps } from "../../../../components/checkout-steps";
import { fetchOrder } from "../../../../lib/api/orders";
import { formatPrice } from "../../../../lib/format";

export default function OrderConfirmationPage({ params }: { params: { orderId: string } }) {
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", params.orderId],
    queryFn: () => fetchOrder(params.orderId),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-gutter py-16">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-gutter py-16 text-center">
      <CheckoutSteps current="confirmation" />
      <CheckCircle2 className="h-14 w-14 text-success" />
      <h1 className="text-2xl font-medium text-foreground">Order placed!</h1>
      <p className="text-foreground-muted">
        Thank you — your order <span className="font-medium text-foreground">{order.orderNumber}</span> has been
        received and is being processed.
      </p>
      <div className="w-full rounded-md border border-border p-5 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-muted">Order total</span>
          <span className="font-medium text-foreground">{formatPrice(order.total)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-foreground-muted">Items</span>
          <span className="text-foreground">{order.items.length}</span>
        </div>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/">Continue shopping</Link>
        </Button>
        <Button asChild>
          <Link href={`/account/orders/${order.id}`}>View order</Link>
        </Button>
      </div>
    </div>
  );
}
