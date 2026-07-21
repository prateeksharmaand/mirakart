"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Skeleton,
  StatusBadge,
  Textarea,
  toast,
} from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { ConfirmDialog } from "../../../../components/confirm-dialog";
import {
  acceptOrder,
  cancelOrder,
  getMerchantOrder,
  markCodRefused,
  rejectOrder,
  updateFulfillmentStatus,
  type FulfillmentStatus,
} from "../../../../lib/api/orders";
import { useAuthStore } from "../../../../stores/auth-store";

const reasonSchema = z.object({ reason: z.string().min(10, "Provide at least 10 characters") });
type ReasonForm = z.infer<typeof reasonSchema>;

const NEXT_FULFILLMENT_STATUS: Partial<Record<string, { status: FulfillmentStatus; label: string }>> = {
  ACCEPTED: { status: "PROCESSING", label: "Mark Processing" },
  PROCESSING: { status: "PACKED", label: "Mark Packed" },
  PACKED: { status: "SHIPPED", label: "Mark Shipped" },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function MerchantOrderDetailPage({ params }: { params: { id: string } }) {
  const { merchant } = useAuthStore();
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [refuseOpen, setRefuseOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [advanceOpen, setAdvanceOpen] = React.useState(false);

  const { data: order, isLoading } = useQuery({ queryKey: ["merchant-order", params.id], queryFn: () => getMerchantOrder(params.id) });

  const rejectForm = useForm<ReasonForm>({ resolver: zodResolver(reasonSchema) });
  const refuseForm = useForm<ReasonForm>({ resolver: zodResolver(reasonSchema) });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["merchant-order", params.id] });
  }

  const acceptMutation = useMutation({
    mutationFn: () => acceptOrder(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Order accepted", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectOrder(params.id, reason),
    onSuccess: () => { invalidate(); toast({ title: "Order declined", variant: "success" }); setRejectOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const advanceMutation = useMutation({
    mutationFn: (status: FulfillmentStatus) => updateFulfillmentStatus(params.id, status),
    onSuccess: () => { invalidate(); toast({ title: "Order updated", variant: "success" }); setAdvanceOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const refuseMutation = useMutation({
    mutationFn: (reason: string) => markCodRefused(params.id, reason),
    onSuccess: () => { invalidate(); toast({ title: "Marked as COD refused", variant: "success" }); setRefuseOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Order cancelled", variant: "success" }); setCancelOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!order) return <p>Order not found.</p>;

  // Only show items belonging to this merchant
  const myItems = order.items?.filter((item) => item.merchantId === merchant?.id) ?? [];
  const myItemStatus = myItems[0]?.status;
  const awaitingAcceptance = myItems.length > 0 && myItems.every((i) => i.status === "CONFIRMED");
  const nextStage = myItemStatus ? NEXT_FULFILLMENT_STATUS[myItemStatus] : undefined;
  const canRefuse = order.status === "DELIVERED";
  const canCancel = myItems.length > 0 && !["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED", "FAILED_DELIVERY", "COD_REFUSED"].includes(myItemStatus ?? "");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={`Order #${order.orderNumber}`}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Orders", href: "/orders" }, { label: `#${order.orderNumber}` }]}
        action={
          <div className="flex flex-wrap gap-2">
            {awaitingAcceptance && (
              <>
                <Button variant="outline" onClick={() => setRejectOpen(true)}>Reject</Button>
                <Button onClick={() => acceptMutation.mutate()} isLoading={acceptMutation.isPending}>Accept Order</Button>
              </>
            )}
            {nextStage && <Button onClick={() => setAdvanceOpen(true)}>{nextStage.label}</Button>}
            {canRefuse && <Button variant="outline" onClick={() => setRefuseOpen(true)}>Mark COD Refused</Button>}
            {canCancel && <Button variant="danger" onClick={() => setCancelOpen(true)}>Cancel</Button>}
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={order.status} /></div>
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
                  <p className="text-sm font-medium">{item.productNameSnapshot}</p>
                  <p className="text-xs text-muted-foreground">SKU: {item.variantSnapshot?.sku ?? "—"} · Qty: {item.quantity}</p>
                  <div className="mt-1"><StatusBadge status={item.status} /></div>
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

      <ConfirmDialog
        open={advanceOpen}
        title={nextStage?.label ?? "Update status"}
        description={`Move order #${order.orderNumber} to ${nextStage?.status ?? ""}?`}
        confirmLabel={nextStage?.label}
        isLoading={advanceMutation.isPending}
        onConfirm={() => nextStage && advanceMutation.mutate(nextStage.status)}
        onCancel={() => setAdvanceOpen(false)}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel order"
        description={`Cancel your items on order #${order.orderNumber}? Reserved inventory will be restored.`}
        confirmLabel="Cancel Order"
        variant="danger"
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setCancelOpen(false)}
      />

      <Dialog open={rejectOpen} onOpenChange={(o) => !o && setRejectOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject order</DialogTitle></DialogHeader>
          <form onSubmit={rejectForm.handleSubmit((v) => rejectMutation.mutate(v.reason))}>
            <FormField label="Reason" htmlFor="reject-reason" error={rejectForm.formState.errors.reason?.message} required>
              <Textarea id="reject-reason" rows={3} {...rejectForm.register("reason")} />
            </FormField>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button type="submit" variant="danger" isLoading={rejectMutation.isPending}>Reject Order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={refuseOpen} onOpenChange={(o) => !o && setRefuseOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark COD refused</DialogTitle></DialogHeader>
          <form onSubmit={refuseForm.handleSubmit((v) => refuseMutation.mutate(v.reason))}>
            <FormField label="Reason" htmlFor="refuse-reason" error={refuseForm.formState.errors.reason?.message} required>
              <Textarea id="refuse-reason" rows={3} {...refuseForm.register("reason")} />
            </FormField>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setRefuseOpen(false)}>Cancel</Button>
              <Button type="submit" variant="danger" isLoading={refuseMutation.isPending}>Mark Refused</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
