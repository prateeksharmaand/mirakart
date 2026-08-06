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
  Input,
  OrderTimeline,
  RadioGroup,
  RadioGroupItem,
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
  acceptOrder,
  cancelOrder,
  completeOrder,
  dispatchOrder,
  getMerchantOrder,
  markCodReceived,
  markCodRefused,
  rejectOrder,
  updateFulfillmentStatus,
  updateShipment,
  COURIER_PARTNERS,
  type DispatchMethod,
  type DispatchOrderInput,
  type FulfillmentStatus,
} from "../../../../lib/api/orders";
import { useAuthStore } from "../../../../stores/auth-store";

const reasonSchema = z.object({ reason: z.string().min(10, "Provide at least 10 characters") });
type ReasonForm = z.infer<typeof reasonSchema>;

const dispatchSchema = z
  .object({
    dispatchMethod: z.enum(["COURIER", "SELF_DELIVERY"]),
    courierPartner: z.string().optional(),
    customCourierName: z.string().optional(),
    trackingNumber: z.string().optional(),
    deliveryPersonName: z.string().optional(),
    deliveryPersonPhone: z.string().optional(),
    vehicleNumber: z.string().optional(),
    expectedDeliveryDate: z.string().optional(),
    shipmentNotes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.dispatchMethod === "COURIER") {
      if (!data.courierPartner) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["courierPartner"], message: "Required" });
      if (!data.trackingNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["trackingNumber"], message: "Required" });
      if (data.courierPartner === "Other" && !data.customCourierName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customCourierName"], message: "Required" });
      }
    } else {
      if (!data.deliveryPersonName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryPersonName"], message: "Required" });
      if (!data.deliveryPersonPhone) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryPersonPhone"], message: "Required" });
    }
  });
type DispatchForm = z.infer<typeof dispatchSchema>;

const editShipmentSchema = z.object({
  trackingNumber: z.string().optional(),
  courierPartner: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
});
type EditShipmentForm = z.infer<typeof editShipmentSchema>;

const codReceivedSchema = z.object({
  amountReceived: z.coerce.number().positive("Enter the amount received"),
  receivedDate: z.string().min(1, "Required"),
  remarks: z.string().optional(),
});
type CodReceivedForm = z.infer<typeof codReceivedSchema>;

const NEXT_FULFILLMENT_STATUS: Partial<Record<string, { status: FulfillmentStatus; label: string }>> = {
  ACCEPTED: { status: "PROCESSING", label: "Mark Processing" },
  PROCESSING: { status: "PACKED", label: "Mark Packed" },
  PACKED: { status: "READY_TO_SHIP", label: "Mark Ready To Ship" },
  READY_TO_SHIP: { status: "SHIPPED", label: "Mark Shipped" },
  SHIPPED: { status: "OUT_FOR_DELIVERY", label: "Mark Out For Delivery" },
  OUT_FOR_DELIVERY: { status: "DELIVERED", label: "Mark Delivered" },
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
  const [dispatchOpen, setDispatchOpen] = React.useState(false);
  const [editShipmentOpen, setEditShipmentOpen] = React.useState(false);
  const [codReceivedOpen, setCodReceivedOpen] = React.useState(false);

  const { data: order, isLoading } = useQuery({ queryKey: ["merchant-order", params.id], queryFn: () => getMerchantOrder(params.id) });

  const rejectForm = useForm<ReasonForm>({ resolver: zodResolver(reasonSchema) });
  const refuseForm = useForm<ReasonForm>({ resolver: zodResolver(reasonSchema) });
  const dispatchForm = useForm<DispatchForm>({
    resolver: zodResolver(dispatchSchema),
    defaultValues: { dispatchMethod: "COURIER" },
  });
  const editShipmentForm = useForm<EditShipmentForm>({ resolver: zodResolver(editShipmentSchema) });
  const codReceivedForm = useForm<CodReceivedForm>({
    resolver: zodResolver(codReceivedSchema),
    defaultValues: { receivedDate: new Date().toISOString().slice(0, 10) },
  });

  const dispatchMethod = dispatchForm.watch("dispatchMethod");
  const courierPartner = dispatchForm.watch("courierPartner");

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

  const dispatchMutation = useMutation({
    mutationFn: (input: DispatchOrderInput) => dispatchOrder(params.id, input),
    onSuccess: () => {
      invalidate();
      toast({ title: "Order dispatched", variant: "success" });
      setDispatchOpen(false);
      dispatchForm.reset({ dispatchMethod: "COURIER" });
    },
    onError: (e: Error) => toast({ title: "Failed to dispatch", description: e.message, variant: "danger" }),
  });

  const editShipmentMutation = useMutation({
    mutationFn: (input: EditShipmentForm) => updateShipment(params.id, input),
    onSuccess: () => { invalidate(); toast({ title: "Shipment updated", variant: "success" }); setEditShipmentOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const refuseMutation = useMutation({
    mutationFn: (reason: string) => markCodRefused(params.id, reason),
    onSuccess: () => { invalidate(); toast({ title: "Marked as COD refused", variant: "success" }); setRefuseOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

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

  const completeMutation = useMutation({
    mutationFn: () => completeOrder(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Order completed", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Couldn't complete order", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!order) return <p>Order not found.</p>;

  // Only show items belonging to this merchant
  const myItems = order.items?.filter((item) => item.merchantId === merchant?.id) ?? [];
  const myItemStatus = myItems[0]?.status;
  const awaitingAcceptance = myItems.length > 0 && myItems.every((i) => i.status === "CONFIRMED");
  const nextStage = myItemStatus ? NEXT_FULFILLMENT_STATUS[myItemStatus] : undefined;
  const canDispatch = myItemStatus === "PACKED";
  const canComplete = myItemStatus === "DELIVERED";
  const canRefuse = order.status === "DELIVERED";
  const canCollectCod = order.payment?.method === "COD" && order.payment?.status === "UNPAID" && order.status === "DELIVERED";
  const canCancel = myItems.length > 0 && !["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED", "FAILED_DELIVERY", "COD_REFUSED"].includes(myItemStatus ?? "");
  const shipment = myItems.find((i) => i.dispatchDate);
  const canEditShipment = !!shipment && myItems.some((i) => i.status !== "COMPLETED");

  function openEditShipment() {
    editShipmentForm.reset({
      trackingNumber: shipment?.trackingNumber ?? "",
      courierPartner: shipment?.courierPartner ?? "",
      expectedDeliveryDate: shipment?.expectedDeliveryDate ? shipment.expectedDeliveryDate.slice(0, 10) : "",
    });
    setEditShipmentOpen(true);
  }

  function openCodReceived() {
    // Pre-fill with the order total — the amount the customer owes on delivery.
    // Still editable in case less cash was actually collected.
    codReceivedForm.reset({
      amountReceived: order?.total ?? 0,
      receivedDate: new Date().toISOString().slice(0, 10),
    });
    setCodReceivedOpen(true);
  }

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
            {canDispatch && <Button onClick={() => setDispatchOpen(true)}>Dispatch Order</Button>}
            {nextStage && <Button variant="outline" onClick={() => setAdvanceOpen(true)}>{nextStage.label}</Button>}
            {canComplete && (
              <Button onClick={() => completeMutation.mutate()} isLoading={completeMutation.isPending}>
                Complete Order
              </Button>
            )}
            {canCollectCod && <Button onClick={openCodReceived}>Mark COD Payment Received</Button>}
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
            <div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm">{order.customer.phone}</p></div>
          </>
        )}
      </div>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold">Order Timeline</h2>
          <OrderTimeline status={order.status} history={order.statusHistory} />
        </div>
      )}

      {order.shippingAddress && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold">Shipping Address</h2>
          <p className="text-sm">{order.shippingAddress.fullName}</p>
          <p className="text-sm text-muted-foreground">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
          <p className="text-sm text-muted-foreground">{order.shippingAddress.country}</p>
          <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
        </div>
      )}

      {shipment && (
        <div className="rounded-xl border border-border bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Shipment Information</h2>
            {canEditShipment && (
              <Button variant="outline" size="sm" onClick={openEditShipment}>Edit Shipment</Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Dispatch Method</p>
              <p>{shipment.dispatchMethod === "COURIER" ? "Courier Partner" : "Self Delivery"}</p>
            </div>
            {shipment.dispatchMethod === "COURIER" ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Courier</p>
                  <p>{shipment.courierPartner === "Other" ? shipment.customCourierName : shipment.courierPartner}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tracking Number</p>
                  <p className="font-mono">{shipment.trackingNumber ?? "—"}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Delivery Person</p>
                  <p>{shipment.deliveryPersonName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p>{shipment.deliveryPersonPhone}</p>
                </div>
                {shipment.vehicleNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">Vehicle Number</p>
                    <p>{shipment.vehicleNumber}</p>
                  </div>
                )}
              </>
            )}
            {shipment.dispatchDate && (
              <div>
                <p className="text-xs text-muted-foreground">Dispatch Date</p>
                <p>{new Date(shipment.dispatchDate).toLocaleDateString()}</p>
              </div>
            )}
            {shipment.expectedDeliveryDate && (
              <div>
                <p className="text-xs text-muted-foreground">Expected Delivery</p>
                <p>{new Date(shipment.expectedDeliveryDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          {shipment.shipmentNotes && (
            <p className="mt-3 text-xs text-muted-foreground">
              {shipment.dispatchMethod === "COURIER" ? "Shipment Notes: " : "Remarks: "}
              {shipment.shipmentNotes}
            </p>
          )}
        </div>
      )}

      {myItems.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold">Your Items in This Order</h2>
          <div className="flex flex-col gap-3">
            {myItems.map((item) => {
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
                        {[item.product?.productCode, item.product?.category?.name].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-xs text-muted-foreground">SKU: {item.variantSnapshot?.sku ?? "—"} · Qty: {item.quantity}</p>
                      <div className="mt-1"><StatusBadge status={item.status} /></div>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(item.totalPrice)}</p>
                </div>
              );
            })}
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

      <Dialog open={dispatchOpen} onOpenChange={(o) => !o && setDispatchOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dispatch Order</DialogTitle></DialogHeader>
          <form
            onSubmit={dispatchForm.handleSubmit((v) =>
              dispatchMutation.mutate({
                dispatchMethod: v.dispatchMethod,
                courierPartner: v.courierPartner || undefined,
                customCourierName: v.customCourierName || undefined,
                trackingNumber: v.trackingNumber || undefined,
                deliveryPersonName: v.deliveryPersonName || undefined,
                deliveryPersonPhone: v.deliveryPersonPhone || undefined,
                vehicleNumber: v.vehicleNumber || undefined,
                expectedDeliveryDate: v.expectedDeliveryDate || undefined,
                shipmentNotes: v.shipmentNotes || undefined,
              }),
            )}
            className="flex flex-col gap-4"
          >
            <FormField label="Dispatch Method" required>
              <RadioGroup
                value={dispatchMethod}
                onValueChange={(v) => dispatchForm.setValue("dispatchMethod", v as DispatchMethod)}
                className="flex flex-col gap-2"
              >
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <RadioGroupItem value="COURIER" />
                  Courier Partner
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <RadioGroupItem value="SELF_DELIVERY" />
                  Self Delivery
                </label>
              </RadioGroup>
            </FormField>

            {dispatchMethod === "COURIER" ? (
              <>
                <FormField label="Courier Partner" htmlFor="courierPartner" error={dispatchForm.formState.errors.courierPartner?.message} required>
                  <Select value={courierPartner} onValueChange={(v) => dispatchForm.setValue("courierPartner", v)}>
                    <SelectTrigger><SelectValue placeholder="Select courier" /></SelectTrigger>
                    <SelectContent>
                      {COURIER_PARTNERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                {courierPartner === "Other" && (
                  <FormField label="Courier Company Name" htmlFor="customCourierName" error={dispatchForm.formState.errors.customCourierName?.message} required>
                    <Input id="customCourierName" {...dispatchForm.register("customCourierName")} />
                  </FormField>
                )}
                <FormField label="Tracking Number" htmlFor="trackingNumber" error={dispatchForm.formState.errors.trackingNumber?.message} required>
                  <Input id="trackingNumber" {...dispatchForm.register("trackingNumber")} />
                </FormField>
              </>
            ) : (
              <>
                <FormField label="Delivery Person Name" htmlFor="deliveryPersonName" error={dispatchForm.formState.errors.deliveryPersonName?.message} required>
                  <Input id="deliveryPersonName" {...dispatchForm.register("deliveryPersonName")} />
                </FormField>
                <FormField label="Mobile Number" htmlFor="deliveryPersonPhone" error={dispatchForm.formState.errors.deliveryPersonPhone?.message} required>
                  <Input id="deliveryPersonPhone" {...dispatchForm.register("deliveryPersonPhone")} />
                </FormField>
                <FormField label="Vehicle Number" htmlFor="vehicleNumber">
                  <Input id="vehicleNumber" placeholder="Optional" {...dispatchForm.register("vehicleNumber")} />
                </FormField>
              </>
            )}

            <FormField label="Expected Delivery Date" htmlFor="expectedDeliveryDate">
              <Input id="expectedDeliveryDate" type="date" {...dispatchForm.register("expectedDeliveryDate")} />
            </FormField>
            <FormField label={dispatchMethod === "COURIER" ? "Shipment Notes" : "Remarks"} htmlFor="shipmentNotes">
              <Textarea id="shipmentNotes" rows={2} placeholder="Optional" {...dispatchForm.register("shipmentNotes")} />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDispatchOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={dispatchMutation.isPending}>Dispatch Order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editShipmentOpen} onOpenChange={(o) => !o && setEditShipmentOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Shipment</DialogTitle></DialogHeader>
          <form onSubmit={editShipmentForm.handleSubmit((v) => editShipmentMutation.mutate(v))} className="flex flex-col gap-4">
            <FormField label="Tracking Number" htmlFor="edit-trackingNumber">
              <Input id="edit-trackingNumber" {...editShipmentForm.register("trackingNumber")} />
            </FormField>
            <FormField label="Courier" htmlFor="edit-courierPartner">
              <Input id="edit-courierPartner" {...editShipmentForm.register("courierPartner")} />
            </FormField>
            <FormField label="Expected Delivery Date" htmlFor="edit-expectedDeliveryDate">
              <Input id="edit-expectedDeliveryDate" type="date" {...editShipmentForm.register("expectedDeliveryDate")} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditShipmentOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={editShipmentMutation.isPending}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
