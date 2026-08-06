"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge, Button, FormField, Input, Skeleton, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import {
  getMerchantReturn, acceptReturn, rejectReturn, markReturnItemReceived, completeReturn,
  type ReturnStatus,
} from "../../../../lib/api/returns";
import { ConfirmDialog } from "../../../../components/confirm-dialog";

const rejectSchema = z.object({ note: z.string().min(5, "Please provide a reason") });
type RejectForm = z.infer<typeof rejectSchema>;

const completeSchema = z.object({ refundAmount: z.string().optional() });
type CompleteForm = z.infer<typeof completeSchema>;

const STATUS_VARIANT: Record<ReturnStatus, "success" | "warning" | "danger" | "default"> = {
  REQUESTED: "warning",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  AWAITING_SHIPMENT: "default",
  ITEM_RECEIVED: "default",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const DECIDABLE_STATUSES: ReturnStatus[] = ["REQUESTED", "UNDER_REVIEW"];

export default function MerchantReturnDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [acceptOpen, setAcceptOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [receivedOpen, setReceivedOpen] = React.useState(false);
  const [completeOpen, setCompleteOpen] = React.useState(false);

  const { data: ret, isLoading } = useQuery({ queryKey: ["merchant-return", params.id], queryFn: () => getMerchantReturn(params.id) });

  const { register, handleSubmit, formState: { errors } } = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) });
  const completeForm = useForm<CompleteForm>({ resolver: zodResolver(completeSchema) });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["merchant-return", params.id] });
    qc.invalidateQueries({ queryKey: ["merchant-returns"] });
  }

  const acceptMutation = useMutation({
    mutationFn: () => acceptReturn(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Return accepted", variant: "success" }); setAcceptOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (note: string) => rejectReturn(params.id, note),
    onSuccess: () => { invalidate(); toast({ title: "Return rejected" }); setRejectOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const receivedMutation = useMutation({
    mutationFn: () => markReturnItemReceived(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Item marked as received", variant: "success" }); setReceivedOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const completeMutation = useMutation({
    mutationFn: (refundAmount?: number) => completeReturn(params.id, refundAmount),
    onSuccess: () => { invalidate(); toast({ title: "Return completed", variant: "success" }); setCompleteOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!ret) return <p>Return not found.</p>;

  const isDecidable = DECIDABLE_STATUSES.includes(ret.status);

  function openComplete() {
    // Pre-fill with the returned item's paid amount — still editable if the
    // actual refund differs (e.g. a partial refund).
    completeForm.reset({ refundAmount: ret?.orderItem?.totalPrice != null ? String(ret.orderItem.totalPrice) : "" });
    setCompleteOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={`Return — Order #${ret.order?.orderNumber ?? "—"}`}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Returns", href: "/returns" }, { label: `#${ret.order?.orderNumber ?? params.id}` }]}
        action={
          isDecidable ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(true)}>Reject</Button>
              <Button onClick={() => setAcceptOpen(true)}>Accept</Button>
            </div>
          ) : ret.status === "AWAITING_SHIPMENT" ? (
            <Button onClick={() => setReceivedOpen(true)}>Mark Item Received</Button>
          ) : ret.status === "ITEM_RECEIVED" ? (
            <Button onClick={ret.resolutionType === "REPLACEMENT" ? () => setCompleteOpen(true) : openComplete}>
              {ret.resolutionType === "REPLACEMENT" ? "Mark Replacement Sent" : "Complete Refund"}
            </Button>
          ) : null
        }
      />

      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={STATUS_VARIANT[ret.status] ?? "default"}>{ret.status.replaceAll("_", " ")}</Badge></div>
        <div>
          <p className="text-xs text-muted-foreground">Requested</p>
          <Badge variant="default">{ret.resolutionType === "REPLACEMENT" ? "Replacement" : "Refund"}</Badge>
        </div>
        {ret.customer && <div><p className="text-xs text-muted-foreground">Customer</p><p className="text-sm">{ret.customer.firstName} {ret.customer.lastName}</p></div>}
        <div><p className="text-xs text-muted-foreground">Reason</p><p className="text-sm">{ret.reason?.reason ?? "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Quantity</p><p className="text-sm">{ret.quantity}</p></div>
        <div><p className="text-xs text-muted-foreground">Date</p><p className="text-sm">{new Date(ret.createdAt).toLocaleDateString()}</p></div>
        {ret.reasonDetail && <div className="col-span-2"><p className="text-xs text-muted-foreground">Details</p><p className="text-sm">{ret.reasonDetail}</p></div>}
      </div>

      {ret.resolutionType === "REPLACEMENT" && (
        <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Customer bought</p>
            <p className="text-sm">
              {ret.orderItem?.variantSnapshot.attributes.map((a) => `${a.attributeName}: ${a.value}`).join(", ") ||
                ret.orderItem?.variantSnapshot.sku}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Wants instead</p>
            <p className="text-sm">
              {ret.replacementVariant
                ? ret.replacementVariant.attributeValues
                    .map((a) => `${a.attributeValue.attribute.name}: ${a.attributeValue.value}`)
                    .join(", ") || ret.replacementVariant.sku
                : "—"}
            </p>
          </div>
        </div>
      )}

      {ret.images && ret.images.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold">Evidence Images</h2>
          <div className="flex gap-2 flex-wrap">
            {ret.images.map((img) => (
              <a key={img.id} href={img.media.url} target="_blank" rel="noreferrer">
                <img src={img.media.url} alt="Return" className="h-24 w-24 rounded object-cover border border-border" />
              </a>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={acceptOpen}
        title="Accept Return"
        description={
          ret.resolutionType === "REPLACEMENT"
            ? "Accept this replacement request? This will reserve stock for the replacement item; the customer will be notified to ship the original back."
            : "Accept this return request? The customer will be notified."
        }
        isLoading={acceptMutation.isPending}
        onConfirm={() => acceptMutation.mutate()}
        onCancel={() => setAcceptOpen(false)}
      />

      <ConfirmDialog
        open={receivedOpen}
        title="Mark Item Received"
        description="Confirm the returned item has arrived? This restocks the original item."
        isLoading={receivedMutation.isPending}
        onConfirm={() => receivedMutation.mutate()}
        onCancel={() => setReceivedOpen(false)}
      />

      {ret.resolutionType === "REPLACEMENT" ? (
        <ConfirmDialog
          open={completeOpen}
          title="Mark Replacement Sent"
          description="Confirm the replacement item has been shipped to the customer?"
          isLoading={completeMutation.isPending}
          onConfirm={() => completeMutation.mutate(undefined)}
          onCancel={() => setCompleteOpen(false)}
        />
      ) : (
        completeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-modal">
              <h2 className="mb-4 text-lg font-semibold">Complete Refund</h2>
              <p className="mb-4 text-sm text-muted-foreground">Confirm the refund has been processed to the customer.</p>
              <form
                onSubmit={completeForm.handleSubmit((v) =>
                  completeMutation.mutate(v.refundAmount ? Number(v.refundAmount) : undefined),
                )}
              >
                <FormField label="Refund Amount" htmlFor="refundAmount">
                  <Input id="refundAmount" type="number" step="0.01" placeholder="Optional" {...completeForm.register("refundAmount")} />
                </FormField>
                <div className="mt-4 flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setCompleteOpen(false)}>Cancel</Button>
                  <Button type="submit" isLoading={completeMutation.isPending}>Complete Refund</Button>
                </div>
              </form>
            </div>
          </div>
        )
      )}

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-modal">
            <h2 className="mb-4 text-lg font-semibold">Reject Return</h2>
            <form onSubmit={handleSubmit((v) => rejectMutation.mutate(v.note))}>
              <FormField label="Reason for rejection" htmlFor="note" error={errors.note?.message} required>
                <Textarea id="note" rows={3} {...register("note")} />
              </FormField>
              <div className="mt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                <Button type="submit" variant="danger" isLoading={rejectMutation.isPending}>Reject</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
