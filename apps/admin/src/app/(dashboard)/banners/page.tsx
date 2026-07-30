"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Badge, Button, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { ConfirmDialog } from "../../../components/confirm-dialog";
import { TableActions } from "../../../components/table-actions";
import { listBanners, deleteBanner, type Banner } from "../../../lib/api/banners";

export default function BannersPage() {
  const [deleteTarget, setDeleteTarget] = React.useState<Banner | null>(null);
  const [sortBy, setSortBy] = React.useState("sort");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const qc = useQueryClient();

  const { data: banners, isLoading } = useQuery({ queryKey: ["banners"], queryFn: () => listBanners() });

  function handleSortChange(key: string) {
    if (sortBy === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortOrder("asc"); }
  }

  const sortedBanners = React.useMemo(() => {
    const rows = [...(banners ?? [])];
    rows.sort((a, b) => {
      const av = sortBy === "status" ? Number(a.isActive) : sortBy === "sort" ? a.sortOrder
        : sortBy === "position" ? a.position : (a.title ?? "");
      const bv = sortBy === "status" ? Number(b.isActive) : sortBy === "sort" ? b.sortOrder
        : sortBy === "position" ? b.position : (b.title ?? "");
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [banners, sortBy, sortOrder]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["banners"] }); toast({ title: "Banner deleted", variant: "success" }); setDeleteTarget(null); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const columns: Column<Banner>[] = [
    { key: "sno", header: "S No", className: "w-12", cell: (_r, index) => index + 1 },
    {
      key: "image",
      header: "Image",
      className: "w-24",
      cell: (r) => r.media
        ? <img src={r.media.url} alt={r.title ?? "banner"} className="h-12 w-20 rounded object-cover" />
        : <div className="h-12 w-20 rounded bg-gray-100" />,
    },
    { key: "title", header: "Title", sortable: true, cell: (r) => r.title ?? <span className="text-muted-foreground text-xs">No title</span> },
    { key: "position", header: "Position", sortable: true, cell: (r) => <Badge variant="default">{r.position}</Badge> },
    { key: "sort", header: "Sort", sortable: true, cell: (r) => r.sortOrder },
    { key: "status", header: "Active", sortable: true, cell: (r) => <Badge variant={r.isActive ? "success" : "default"}>{r.isActive ? "Yes" : "No"}</Badge> },
    {
      key: "actions", header: "Action", className: "w-16",
      cell: (r) => <TableActions editHref={`/banners/${r.id}`} onDelete={() => setDeleteTarget(r)} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Banners"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Banners" }]}
        action={<Button asChild><Link href="/banners/new"><Plus className="mr-2 h-4 w-4" />New Banner</Link></Button>}
      />
      <DataTable
        columns={columns}
        data={sortedBanners}
        keyField="id"
        isLoading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete banner"
        description={`Delete "${deleteTarget?.title ?? "this banner"}"?`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
