"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  StatusBadge,
  Textarea,
  toast,
} from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { ConfirmDialog } from "../../../../components/confirm-dialog";
import {
  cancelOrder,
  confirmOrder,
  getOrder,
  markCodReceived,
  markCodRefused,
  markOrderDelivered,
  rejectOrder,
  updateOrderStatus,
} from "../../../../lib/api/orders";

const reasonSchema = z.object({ reason: z.string().min(10, "Provide at least 10 characters") });
type ReasonForm = z.infer<typeof reasonSchema>;

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
  const [newStatus, setNewStatus] = React.useState("");
  const [note, setNote] = React.useState("");

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [deliverOpen, setDeliverOpen] = React.useState(false);
  const [codReceivedOpen, setCodReceivedOpen] = React.useState(false);
  const [codRefusedOpen, setCodRefusedOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const { data: order, isLoading } = useQuery({ queryKey: ["order", params.id], queryFn: () => getOrder(params.id) });

  React.useEffect(() => {
    if (order) setNewStatus(order.status);
  }, [order]);

  const rejectForm = useForm<ReasonForm>({ resolver: zodResolver(reasonSchema) });
  const refuseForm = useForm<ReasonForm>({ resolver: zodResolver(reasonSchema) });
  const codReceivedForm = useForm<CodReceivedForm>({
    resolver: zodResolver(codReceivedSchema),
    defaultValues: { receivedDate: new Date().toISOString().slice(0, 10) },
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["order", params.id] });
  }

  const mutation = useMutation({
    mutationFn: () => updateOrderStatus(params.id, newStatus, note || undefined),
    onSuccess: () => { invalidate(); toast({ title: "Order status updated", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmOrder(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Order confirmed", variant: "success" }); setConfirmOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectOrder(params.id, reason),
    onSuccess: () => { invalidate(); toast({ title: "Order rejected", variant: "success" }); setRejectOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const deliverMutation = useMutation({
    mutationFn: () => markOrderDelivered(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Order marked delivered", variant: "success" }); setDeliverOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const codReceivedMutation = useMutation({
    mutationFn: (v: CodReceivedForm) => markCodReceived(params.id, v),
    onSuccess: () => { invalidate(); toast({ title: "COD payment recorded — order completed", variant: "success" }); setCodReceivedOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const codRefusedMutation = useMutation({
    mutationFn: (reason: string) => markCodRefused(params.id, reason),
    onSuccess: () => { invalidate(); toast({ title: "Marked as COD refused", variant: "success" }); setCodRefusedOpen(false); },
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
  const canDeliver = order.status === "SHIPPED" || order.status === "OUT_FOR_DELIVERY";
  const canCollectCod = isCod && order.status === "DELIVERED" && order.payment?.status === "UNPAID";
  const canRefuse = isCod && order.status === "DELIVERED";
  const isTerminal = ["CANCELLED", "REFUNDED", "COMPLETED", "FAILED_DELIVERY", "COD_REFUSED"].includes(order.status);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={`Order #${order.orderNumber}`}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Orders", href: "/orders" }, { label: `#${order.orderNumber}` }]}
        action={
          <div className="flex flex-wrap gap-2">
            {order.status === "PENDING_CONFIRMATION" && (
              <>
                <Button variant="outline" onClick={() => setRejectOpen(true)}>Reject</Button>
                <Button onClick={() => setConfirmOpen(true)}>Confirm Order</Button>
              </>
            )}
            {canDeliver && <Button onClick={() => setDeliverOpen(true)}>Mark Delivered</Button>}
            {canCollectCod && <Button onClick={() => setCodReceivedOpen(true)}>Mark COD Payment Received</Button>}
            {canRefuse && <Button variant="outline" onClick={() => setCodRefusedOpen(true)}>Mark COD Refused</Button>}
            {!isTerminal && <Button variant="danger" onClick={() => setCancelOpen(true)}>Cancel Order</Button>}
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={order.status} /></div>
        <div><p className="text-xs text-muted-foreground">Total</p><p className="text-sm font-semibold">{formatCurrency(order.total)}</p></div>
        {order.customer && (
          <>
            <div><p className="text-xs text-muted-foreground">Customer</p><p className="text-sm">{order.customer.firstName} {order.customer.lastName}</p></div>
            <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm">{order.customer.email}</p></div>
          </>
        )}
        {order.payment && (
          <>
            <div><p className="text-xs text-muted-foreground">Payment Method</p><p className="text-sm">{order.payment.method}</p></div>
            <div><p className="text-xs text-muted-foreground">Payment Status</p><StatusBadge status={order.payment.status} /></div>
            {order.payment.amountReceived != null && (
              <div><p className="text-xs text-muted-foreground">Amount Received</p><p className="text-sm">{formatCurrency(order.payment.amountReceived)}</p></div>
            )}
            {order.payment.paidAt && (
              <div><p className="text-xs text-muted-foreground">Received Date</p><p className="text-sm">{new Date(order.payment.paidAt).toLocaleDateString()}</p></div>
            )}
          </>
        )}
        <div><p className="text-xs text-muted-foreground">Date</p><p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p></div>
        {order.rejectionReason && (
          <div className="col-span-2"><p className="text-xs text-muted-foreground">Rejection Reason</p><p className="text-sm text-danger">{order.rejectionReason}</p></div>
        )}
        {order.cancelReason && (
          <div className="col-span-2"><p className="text-xs text-muted-foreground">Cancel Reason</p><p className="text-sm text-danger">{order.cancelReason}</p></div>
        )}
        {order.payment?.collectionNote && (
          <div className="col-span-2"><p className="text-xs text-muted-foreground">Collection Remarks</p><p className="text-sm">{order.payment.collectionNote}</p></div>
        )}
      </div>

      {order.items && order.items.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold">Items</h2>
          <div className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{item.productNameSnapshot}</p>
                  <p className="text-xs text-muted-foreground">SKU: {item.variantSnapshot?.sku ?? "—"} · Qty: {item.quantity}</p>
                  <StatusBadge status={item.status} />
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
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PENDING_CONFIRMATION">Pending Confirmation</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="PACKED">Packed</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="FAILED_DELIVERY">Failed Delivery</SelectItem>
              <SelectItem value="COD_REFUSED">COD Refused</SelectItem>
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

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm order"
        description={`Confirm order #${order.orderNumber}? The merchant will be notified to begin fulfillment.`}
        confirmLabel="Confirm Order"
        variant="primary"
        isLoading={confirmMutation.isPending}
        onConfirm={() => confirmMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={deliverOpen}
        title="Mark delivered"
        description={`Mark order #${order.orderNumber} as delivered?`}
        confirmLabel="Mark Delivered"
        variant="primary"
        isLoading={deliverMutation.isPending}
        onConfirm={() => deliverMutation.mutate()}
        onCancel={() => setDeliverOpen(false)}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel order"
        description={`Cancel order #${order.orderNumber}? Reserved inventory will be restored.`}
        confirmLabel="Cancel Order"
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

      <Dialog open={codRefusedOpen} onOpenChange={(o) => !o && setCodRefusedOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark COD refused</DialogTitle></DialogHeader>
          <form onSubmit={refuseForm.handleSubmit((v) => codRefusedMutation.mutate(v.reason))}>
            <FormField label="Reason" htmlFor="refuse-reason" error={refuseForm.formState.errors.reason?.message} required>
              <Textarea id="refuse-reason" rows={3} {...refuseForm.register("reason")} />
            </FormField>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setCodRefusedOpen(false)}>Cancel</Button>
              <Button type="submit" variant="danger" isLoading={codRefusedMutation.isPending}>Mark Refused</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
