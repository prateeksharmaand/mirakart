"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, ShoppingCart, IndianRupee, PackageX, CheckCircle2, XCircle, Mail, Phone, Calendar, Hash } from "lucide-react";
import { Badge, Button, FormField, Input, Skeleton, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { ConfirmDialog } from "../../../../components/confirm-dialog";
import { StatsCard } from "../../../../components/stats-card";
import {
  getMerchant,
  getMerchantDocuments,
  getMerchantStats,
  approveMerchant,
  rejectMerchant,
  suspendMerchant,
  activateMerchant,
} from "../../../../lib/api/merchants";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

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
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["merchant-stats", params.id],
    queryFn: () => getMerchantStats(params.id),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) });

  function invalidateMerchantQueries() {
    qc.invalidateQueries({ queryKey: ["merchant", params.id] });
    qc.invalidateQueries({ queryKey: ["merchants"] });
  }

  const approveMutation = useMutation({
    mutationFn: () => approveMerchant(params.id),
    onSuccess: () => { invalidateMerchantQueries(); toast({ title: "Merchant approved", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectMerchant(params.id, reason),
    onSuccess: () => { invalidateMerchantQueries(); toast({ title: "Merchant rejected", variant: "success" }); setRejectOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const suspendMutation = useMutation({
    mutationFn: () => suspendMerchant(params.id),
    onSuccess: () => { invalidateMerchantQueries(); toast({ title: "Merchant suspended" }); setSuspendOpen(false); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const activateMutation = useMutation({
    mutationFn: () => activateMerchant(params.id),
    onSuccess: () => { invalidateMerchantQueries(); toast({ title: "Merchant reinstated", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /></div>;
  if (!merchant) return <p>Merchant not found.</p>;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
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
            {merchant.status === "SUSPENDED" && (
              <Button onClick={() => activateMutation.mutate()} isLoading={activateMutation.isPending}>Activate</Button>
            )}
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold uppercase text-primary">
            {merchant.storeName.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-foreground">{merchant.storeName}</p>
              <Badge variant={STATUS_VARIANT[merchant.status] ?? "default"}>{merchant.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">@{merchant.storeSlug}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <a href={`mailto:${merchant.email}`} className="text-sm hover:text-primary hover:underline">{merchant.email}</a>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <a href={`tel:${merchant.phone}`} className="text-sm hover:text-primary hover:underline">{merchant.phone}</a>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="text-sm">{new Date(merchant.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {merchant.rejectionReason && (
          <div className="mt-4 flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 p-3">
            <Hash className="h-4 w-4 shrink-0 text-danger" />
            <div>
              <p className="text-xs font-medium text-danger">Rejection Reason</p>
              <p className="text-sm text-danger">{merchant.rejectionReason}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-2">
          <StatsCard title="Products" value={stats?.totalProducts ?? "—"} icon={Package} isLoading={statsLoading}
            subtitle={stats ? `${stats.activeProducts} active · ${stats.suspendedProducts} suspended` : undefined} />
          <StatsCard title="Out of Stock" value={stats?.outOfStockProducts ?? "—"} icon={PackageX} iconColor="text-red-600" isLoading={statsLoading} />
          <StatsCard title="Total Orders" value={stats?.totalOrders ?? "—"} icon={ShoppingCart} isLoading={statsLoading} />
          <StatsCard title="Completed Orders" value={stats?.completedOrders ?? "—"} icon={CheckCircle2} iconColor="text-green-600" isLoading={statsLoading} />
          <StatsCard title="Pending Orders" value={stats?.pendingOrders ?? "—"} icon={ShoppingCart} iconColor="text-amber-600" isLoading={statsLoading} />
          <StatsCard title="Cancelled Orders" value={stats?.cancelledOrders ?? "—"} icon={XCircle} iconColor="text-red-600" isLoading={statsLoading} />
          <StatsCard title="Revenue" value={stats ? formatCurrency(stats.totalRevenue) : "—"} icon={IndianRupee} iconColor="text-green-600" isLoading={statsLoading} />
          <StatsCard
            title="Best Seller"
            value={stats?.bestSellingProduct?.name ?? "—"}
            icon={Package}
            isLoading={statsLoading}
          />
        </div>

        <div className="rounded-xl border border-border bg-white p-6 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold">Documents</h2>
          {docs && docs.length > 0 ? (
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
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded.</p>
          )}
        </div>
      </div>

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
