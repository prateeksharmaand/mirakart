"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Skeleton } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getMerchantOrder } from "../../../../lib/api/orders";
import { useAuthStore } from "../../../../stores/auth-store";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default" | "primary"> = {
  DELIVERED: "success", PROCESSING: "warning", CANCELLED: "danger", PENDING: "default", SHIPPED: "primary",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function MerchantOrderDetailPage({ params }: { params: { id: string } }) {
  const { merchant } = useAuthStore();
  const { data: order, isLoading } = useQuery({ queryKey: ["merchant-order", params.id], queryFn: () => getMerchantOrder(params.id) });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!order) return <p>Order not found.</p>;

  // Only show items belonging to this merchant
  const myItems = order.items?.filter((item) => item.merchantId === merchant?.id) ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={`Order #${order.orderNumber}`}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Orders", href: "/orders" }, { label: `#${order.orderNumber}` }]}
      />

      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={STATUS_VARIANT[order.status] ?? "default"}>{order.status}</Badge></div>
        <div><p className="text-xs text-muted-foreground">Date</p><p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p></div>
        {order.customer && (
          <>
            <div><p className="text-xs text-muted-foreground">Customer</p><p className="text-sm">{order.customer.firstName} {order.customer.lastName}</p></div>
            <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm">{order.customer.email}</p></div>
          </>
        )}
      </div>

      {myItems.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold">Your Items in This Order</h2>
          <div className="flex flex-col gap-3">
            {myItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">SKU: {item.variantSku} · Qty: {item.quantity}</p>
                  <Badge variant={STATUS_VARIANT[item.status] ?? "default"} className="mt-1 text-[10px]">{item.status}</Badge>
                </div>
                <p className="text-sm font-medium">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-3 flex justify-between">
            <span className="text-sm font-semibold">Your Total</span>
            <span className="text-sm font-semibold">{formatCurrency(myItems.reduce((s, i) => s + i.totalPrice, 0))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
