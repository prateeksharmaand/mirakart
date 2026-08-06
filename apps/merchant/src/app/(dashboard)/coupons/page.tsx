"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Input, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { ConfirmDialog } from "../../../components/confirm-dialog";
import { CouponQuickView } from "../../../components/coupon-quick-view";
import { listCoupons, updateCoupon, type Coupon } from "../../../lib/api/coupons";

function formatDiscount(c: Coupon) {
  return c.discountType === "PERCENTAGE" ? `${c.discountValue}% off` : `₹${c.discountValue} off`;
}

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

export default function CouponsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [quickViewId, setQuickViewId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Coupon | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["coupons", page, search, status, sortBy, sortOrder],
    queryFn: () =>
      listCoupons({
        page,
        limit: 10,
        search: search || undefined,
        isActive: status === "all" ? undefined : status === "active",
        sortBy,
        sortOrder,
      }),
  });

  function handleSortChange(key: string) {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  }

  const hasActiveFilters = search !== "" || status !== "all";
  function handleResetFilters() {
    setSearch("");
    setStatus("all");
    setPage(1);
  }

  const deleteMutation = useMutation({
    // Coupons don't hard-delete — past orders keep a durable reference via
    // couponCode/couponId, and redemption history would cascade-delete with
    // them. "Delete" here deactivates instead, same as the isActive toggle.
    mutationFn: (id: string) => updateCoupon(id, { isActive: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      toast({ title: "Coupon deleted", variant: "success" });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const columns: Column<Coupon>[] = [
    {
      key: "sno",
      header: "S No",
      className: "w-12",
      cell: (_r, index) => (data?.meta ? (data.meta.page - 1) * data.meta.limit : 0) + index + 1,
    },
    {
      key: "code",
      header: "Code",
      sortable: true,
      cell: (r) => (
        <button type="button" onClick={() => setQuickViewId(r.id)} className="font-mono text-sm font-medium hover:text-primary hover:underline">
          {r.code}
        </button>
      ),
    },
    { key: "discount", header: "Discount", cell: (r) => formatDiscount(r) },
    {
      key: "usedCount",
      header: "Usage",
      sortable: true,
      cell: (r) => (r.usageLimit ? `${r.usedCount} / ${r.usageLimit}` : `${r.usedCount}`),
    },
    {
      key: "expiresAt",
      header: "Validity",
      sortable: true,
      cell: (r) => (r.startsAt || r.expiresAt ? `${formatDate(r.startsAt)} – ${formatDate(r.expiresAt)}` : "No expiry"),
    },
    { key: "status", header: "Status", cell: (r) => <Badge variant={r.isActive ? "success" : "default"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
    {
      key: "actions",
      header: "Action",
      className: "w-24",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Link href={`/coupons/${r.id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
          <button
            type="button"
            onClick={() => setDeleteTarget(r)}
            className="inline-flex items-center gap-1 text-sm text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
            disabled={!r.isActive}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Coupons"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Coupons" }]}
        action={<Button asChild><Link href="/coupons/new"><Plus className="mr-2 h-4 w-4" />New Coupon</Link></Button>}
      />
      <div className="flex gap-3">
        <Input placeholder="Search by code…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleResetFilters} disabled={!hasActiveFilters}>
          Clear Filters
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No coupons yet — click “New Coupon” to create one."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />
      {data?.meta && data.meta.totalPages > 1 && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
      )}
      <CouponQuickView couponId={quickViewId} onOpenChange={(open) => !open && setQuickViewId(null)} />
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete coupon"
        description={`Delete "${deleteTarget?.code}"? It will stop working immediately. Past orders that used it keep their discount record.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
