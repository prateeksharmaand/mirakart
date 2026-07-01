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
  const qc = useQueryClient();

  const { data: banners, isLoading } = useQuery({ queryKey: ["banners"], queryFn: () => listBanners() });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["banners"] }); toast({ title: "Banner deleted", variant: "success" }); setDeleteTarget(null); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const columns: Column<Banner>[] = [
    {
      key: "image",
      header: "Image",
      className: "w-24",
      cell: (r) => r.media
        ? <img src={r.media.url} alt={r.title ?? "banner"} className="h-12 w-20 rounded object-cover" />
        : <div className="h-12 w-20 rounded bg-gray-100" />,
    },
    { key: "title", header: "Title", cell: (r) => r.title ?? <span className="text-muted-foreground text-xs">No title</span> },
    { key: "position", header: "Position", cell: (r) => <Badge variant="default">{r.position}</Badge> },
    { key: "sort", header: "Sort", cell: (r) => r.sortOrder },
    { key: "status", header: "Active", cell: (r) => <Badge variant={r.isActive ? "success" : "default"}>{r.isActive ? "Yes" : "No"}</Badge> },
    {
      key: "actions", header: "", className: "w-16",
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
      <DataTable columns={columns} data={banners ?? []} keyField="id" isLoading={isLoading} />
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
