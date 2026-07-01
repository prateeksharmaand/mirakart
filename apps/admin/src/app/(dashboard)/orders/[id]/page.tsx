"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getOrder, updateOrderStatus } from "../../../../lib/api/orders";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default" | "primary"> = {
  DELIVERED: "success", PROCESSING: "warning", CANCELLED: "danger", PENDING: "default", SHIPPED: "primary",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = React.useState("");
  const [note, setNote] = React.useState("");

  const { data: order, isLoading } = useQuery({ queryKey: ["order", params.id], queryFn: () => getOrder(params.id) });

  React.useEffect(() => { if (order) setNewStatus(order.status); }, [order]);

  const mutation = useMutation({
    mutationFn: () => updateOrderStatus(params.id, newStatus, note || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["order", params.id] }); toast({ title: "Order status updated", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /></div>;
  if (!order) return <p>Order not found.</p>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={`Order #${order.orderNumber}`}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Orders", href: "/orders" }, { label: `#${order.orderNumber}` }]}
      />

      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={STATUS_VARIANT[order.status] ?? "default"}>{order.status}</Badge></div>
        <div><p className="text-xs text-muted-foreground">Total</p><p className="text-sm font-semibold">{formatCurrency(order.total)}</p></div>
        {order.customer && (
          <>
            <div><p className="text-xs text-muted-foreground">Customer</p><p className="text-sm">{order.customer.firstName} {order.customer.lastName}</p></div>
            <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm">{order.customer.email}</p></div>
          </>
        )}
        {order.payment && (
          <div><p className="text-xs text-muted-foreground">Payment</p><Badge variant={order.payment.status === "PAID" ? "success" : "warning"}>{order.payment.status}</Badge></div>
        )}
        <div><p className="text-xs text-muted-foreground">Date</p><p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p></div>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold">Items</h2>
          <div className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">SKU: {item.variantSku} · Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold">Update Status</h2>
        <div className="flex flex-col gap-3">
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div>
            <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending} disabled={newStatus === order.status}>
              Update Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
