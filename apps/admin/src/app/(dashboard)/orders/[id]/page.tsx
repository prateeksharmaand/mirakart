"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Mail, Phone } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Skeleton,
  StatusBadge,
  Textarea,
  toast,
} from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { ConfirmDialog } from "../../../../components/confirm-dialog";
import { cancelOrder, getOrder, markCodReceived } from "../../../../lib/api/orders";

const codReceivedSchema = z.object({
  amountReceived: z.coerce.number().positive("Enter the amount received"),
  receivedDate: z.string().min(1, "Required"),
  remarks: z.string().optional(),
});
type CodReceivedForm = z.infer<typeof codReceivedSchema>;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [codReceivedOpen, setCodReceivedOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const { data: order, isLoading } = useQuery({ queryKey: ["order", params.id], queryFn: () => getOrder(params.id) });

  const codReceivedForm = useForm<CodReceivedForm>({
    resolver: zodResolver(codReceivedSchema),
    defaultValues: { receivedDate: new Date().toISOString().slice(0, 10) },
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["order", params.id] });
  }

  const codReceivedMutation = useMutation({
    mutationFn: (v: CodReceivedForm) => markCodReceived(params.id, v),
    onSuccess: () => { invalidate(); toast({ title: "COD payment recorded — order completed", variant: "success" }); setCodReceivedOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Order cancelled", variant: "success" }); setCancelOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /></div>;
  if (!order) return <p>Order not found.</p>;

  const isCod = order.payment?.method === "COD";
  const canCollectCod = isCod && order.status === "DELIVERED" && order.payment?.status === "UNPAID";
  const isTerminal = ["CANCELLED", "REFUNDED", "COMPLETED", "FAILED_DELIVERY", "COD_REFUSED"].includes(order.status);

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <PageHeader
        title={`Order #${order.orderNumber}`}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Orders", href: "/orders" }, { label: `#${order.orderNumber}` }]}
        action={
          <div className="flex flex-wrap gap-2">
            {/* Fulfillment (Accept/Processing/Packed/Shipped/Delivered/Complete) belongs
                to the merchant now — admin keeps only financial reconciliation and
                exception handling here. */}
            {canCollectCod && <Button onClick={() => setCodReceivedOpen(true)}>Mark COD Payment Received</Button>}
            {!isTerminal && <Button variant="danger" onClick={() => setCancelOpen(true)}>Cancel Order</Button>}
          </div>
        }
      />

      {(order.rejectionReason || order.cancelReason) && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
          {order.rejectionReason && (
            <p className="text-sm text-danger"><span className="font-medium">Rejection Reason:</span> {order.rejectionReason}</p>
          )}
          {order.cancelReason && (
            <p className="text-sm text-danger"><span className="font-medium">Cancel Reason:</span> {order.cancelReason}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {order.items && order.items.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold">Items</h2>
              <div className="flex flex-col gap-3">
                {order.items.map((item) => {
                  const image = item.product?.images[0]?.media.url;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-50">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.productNameSnapshot}</p>
                          <p className="text-xs text-muted-foreground">
                            {[item.product?.productCode, item.merchant?.storeName].filter(Boolean).join(" · ")}
                          </p>
                          <p className="text-xs text-muted-foreground">SKU: {item.variantSnapshot?.sku ?? "—"} · Qty: {item.quantity}</p>
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                      <p className="text-sm font-medium">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(order.shippingAddress || order.billingAddress) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {order.shippingAddress && (
                <div className="rounded-xl border border-border bg-white p-6">
                  <h2 className="mb-3 text-sm font-semibold">Shipping Address</h2>
                  <p className="text-sm">{order.shippingAddress.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">{order.shippingAddress.country}</p>
                  <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
                </div>
              )}
              {order.billingAddress && (
                <div className="rounded-xl border border-border bg-white p-6">
                  <h2 className="mb-3 text-sm font-semibold">Billing Address</h2>
                  <p className="text-sm">{order.billingAddress.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.billingAddress.line1}{order.billingAddress.line2 ? `, ${order.billingAddress.line2}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">{order.billingAddress.country}</p>
                  <p className="text-sm text-muted-foreground">{order.billingAddress.phone}</p>
                </div>
              )}
            </div>
          )}

          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold">Order Timeline</h2>
              <div className="flex flex-col gap-3">
                {order.statusHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={entry.status} />
                      {entry.note && <span className="text-xs text-muted-foreground">{entry.note}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.changedAt).toLocaleString()}
                      {entry.changedByType ? ` · ${entry.changedByType}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold">Order Overview</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-sm font-semibold">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex items-center gap-2.5 border-t border-border pt-3">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {order.customer && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold">Customer</h2>
              <p className="text-sm font-medium">{order.customer.firstName} {order.customer.lastName}</p>
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a href={`mailto:${order.customer.email}`} className="text-sm hover:text-primary hover:underline">{order.customer.email}</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a href={`tel:${order.customer.phone}`} className="text-sm hover:text-primary hover:underline">{order.customer.phone}</a>
                </div>
              </div>
            </div>
          )}

          {order.payment && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold">Payment</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Method</span>
                  <span className="text-sm">{order.payment.method}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={order.payment.status} />
                </div>
                {order.payment.amountReceived != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Amount Received</span>
                    <span className="text-sm">{formatCurrency(order.payment.amountReceived)}</span>
                  </div>
                )}
                {order.payment.paidAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Received Date</span>
                    <span className="text-sm">{new Date(order.payment.paidAt).toLocaleDateString()}</span>
                  </div>
                )}
                {order.payment.collectionNote && (
                  <p className="border-t border-border pt-3 text-sm text-muted-foreground">{order.payment.collectionNote}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel order"
        description={`Cancel order #${order.orderNumber}? Reserved inventory will be restored.`}
        confirmLabel="Cancel Order"
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setCancelOpen(false)}
      />

      <Dialog open={codReceivedOpen} onOpenChange={(o) => !o && setCodReceivedOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark COD payment received</DialogTitle></DialogHeader>
          <form onSubmit={codReceivedForm.handleSubmit((v) => codReceivedMutation.mutate(v))} className="flex flex-col gap-3">
            <FormField label="Amount Received" htmlFor="amountReceived" error={codReceivedForm.formState.errors.amountReceived?.message} required>
              <Input id="amountReceived" type="number" step="0.01" {...codReceivedForm.register("amountReceived")} />
            </FormField>
            <FormField label="Received Date" htmlFor="receivedDate" error={codReceivedForm.formState.errors.receivedDate?.message} required>
              <Input id="receivedDate" type="date" {...codReceivedForm.register("receivedDate")} />
            </FormField>
            <FormField label="Remarks" htmlFor="remarks">
              <Textarea id="remarks" rows={2} {...codReceivedForm.register("remarks")} />
            </FormField>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setCodReceivedOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={codReceivedMutation.isPending}>Mark Received</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
