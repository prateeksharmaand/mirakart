"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge, Button, FormField, Skeleton, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getMerchantReturn, acceptReturn, rejectReturn } from "../../../../lib/api/returns";
import { ConfirmDialog } from "../../../../components/confirm-dialog";

const rejectSchema = z.object({ note: z.string().min(5, "Please provide a reason") });
type RejectForm = z.infer<typeof rejectSchema>;

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  APPROVED: "success", PENDING: "warning", REJECTED: "danger", REFUNDED: "success",
};

function ConfirmDialogLocal({ open, title, description, isLoading, onConfirm, onCancel }: {
  open: boolean; title: string; description: string; isLoading?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return <ConfirmDialog open={open} title={title} description={description} isLoading={isLoading} onConfirm={onConfirm} onCancel={onCancel} />;
}

export default function MerchantReturnDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [acceptOpen, setAcceptOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);

  const { data: ret, isLoading } = useQuery({ queryKey: ["merchant-return", params.id], queryFn: () => getMerchantReturn(params.id) });

  const { register, handleSubmit, formState: { errors } } = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) });

  const acceptMutation = useMutation({
    mutationFn: () => acceptReturn(params.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["merchant-return", params.id] }); toast({ title: "Return accepted", variant: "success" }); setAcceptOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (note: string) => rejectReturn(params.id, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["merchant-return", params.id] }); toast({ title: "Return rejected" }); setRejectOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!ret) return <p>Return not found.</p>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={`Return — Order #${ret.order?.orderNumber ?? "—"}`}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Returns", href: "/returns" }, { label: `#${ret.order?.orderNumber ?? params.id}` }]}
        action={
          ret.status === "PENDING" ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(true)}>Reject</Button>
              <Button onClick={() => setAcceptOpen(true)}>Accept</Button>
            </div>
          ) : null
        }
      />

      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={STATUS_VARIANT[ret.status] ?? "default"}>{ret.status}</Badge></div>
        {ret.customer && <div><p className="text-xs text-muted-foreground">Customer</p><p className="text-sm">{ret.customer.firstName} {ret.customer.lastName}</p></div>}
        <div><p className="text-xs text-muted-foreground">Reason</p><p className="text-sm">{ret.reason?.name ?? "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Date</p><p className="text-sm">{new Date(ret.createdAt).toLocaleDateString()}</p></div>
        {ret.description && <div className="col-span-2"><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{ret.description}</p></div>}
      </div>

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

      <ConfirmDialogLocal
        open={acceptOpen}
        title="Accept Return"
        description="Accept this return request? The customer will be notified."
        isLoading={acceptMutation.isPending}
        onConfirm={() => acceptMutation.mutate()}
        onCancel={() => setAcceptOpen(false)}
      />

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
