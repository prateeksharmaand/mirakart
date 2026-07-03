"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Button, FormField, Input, Skeleton, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { ConfirmDialog } from "../../../../components/confirm-dialog";
import { getMerchant, getMerchantDocuments, approveMerchant, rejectMerchant, suspendMerchant } from "../../../../lib/api/merchants";

const rejectSchema = z.object({ rejectionReason: z.string().min(10, "Provide at least 10 characters") });
type RejectForm = z.infer<typeof rejectSchema>;

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  APPROVED: "success", PENDING: "warning", REJECTED: "danger", SUSPENDED: "danger",
};

export default function MerchantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [suspendOpen, setSuspendOpen] = React.useState(false);

  const { data: merchant, isLoading } = useQuery({
    queryKey: ["merchant", params.id],
    queryFn: () => getMerchant(params.id),
  });
  const { data: docs } = useQuery({
    queryKey: ["merchant-docs", params.id],
    queryFn: () => getMerchantDocuments(params.id),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) });

  const approveMutation = useMutation({
    mutationFn: () => approveMerchant(params.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["merchant", params.id] }); toast({ title: "Merchant approved", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectMerchant(params.id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["merchant", params.id] }); toast({ title: "Merchant rejected", variant: "success" }); setRejectOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const suspendMutation = useMutation({
    mutationFn: () => suspendMerchant(params.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["merchant", params.id] }); toast({ title: "Merchant suspended" }); setSuspendOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /></div>;
  if (!merchant) return <p>Merchant not found.</p>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={merchant.storeName}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Merchants", href: "/merchants" }, { label: merchant.storeName }]}
        action={
          <div className="flex gap-2">
            {merchant.status === "PENDING" && (
              <>
                <Button variant="outline" onClick={() => setRejectOpen(true)}>Reject</Button>
                <Button onClick={() => approveMutation.mutate()} isLoading={approveMutation.isPending}>Approve</Button>
              </>
            )}
            {merchant.status === "APPROVED" && (
              <Button variant="danger" onClick={() => setSuspendOpen(true)}>Suspend</Button>
            )}
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={STATUS_VARIANT[merchant.status] ?? "default"}>{merchant.status}</Badge></div>
        <div><p className="text-xs text-muted-foreground">Store Slug</p><p className="text-sm font-medium">@{merchant.storeSlug}</p></div>
        <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm">{merchant.email}</p></div>
        <div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm">{merchant.phone}</p></div>
        <div><p className="text-xs text-muted-foreground">Joined</p><p className="text-sm">{new Date(merchant.createdAt).toLocaleDateString()}</p></div>
        {merchant.rejectionReason && (
          <div className="col-span-2"><p className="text-xs text-muted-foreground">Rejection Reason</p><p className="text-sm text-danger">{merchant.rejectionReason}</p></div>
        )}
      </div>

      {docs && docs.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold">Documents</h2>
          <div className="flex flex-col gap-3">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium capitalize">{doc.type.toLowerCase().replace("_", " ")}</p>
                  <Badge variant={doc.status === "VERIFIED" ? "success" : doc.status === "REJECTED" ? "danger" : "warning"} className="mt-1">{doc.status}</Badge>
                </div>
                <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-modal">
            <h2 className="mb-4 text-lg font-semibold">Reject Merchant</h2>
            <form onSubmit={handleSubmit((v) => rejectMutation.mutate(v.rejectionReason))}>
              <FormField label="Reason" htmlFor="rejectionReason" error={errors.rejectionReason?.message} required>
                <Textarea id="rejectionReason" rows={3} {...register("rejectionReason")} />
              </FormField>
              <div className="mt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                <Button type="submit" variant="danger" isLoading={rejectMutation.isPending}>Reject</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={suspendOpen}
        title="Suspend merchant"
        description={`Suspend "${merchant.storeName}"? They won't be able to accept orders.`}
        confirmLabel="Suspend"
        isLoading={suspendMutation.isPending}
        onConfirm={() => suspendMutation.mutate()}
        onCancel={() => setSuspendOpen(false)}
      />
    </div>
  );
}
