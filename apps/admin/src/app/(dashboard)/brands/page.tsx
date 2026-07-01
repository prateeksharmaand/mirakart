"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Badge, Button, Pagination, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { ConfirmDialog } from "../../../components/confirm-dialog";
import { TableActions } from "../../../components/table-actions";
import { listBrands, deleteBrand, type Brand } from "../../../lib/api/catalog";

export default function BrandsPage() {
  const [page, setPage] = React.useState(1);
  const [deleteTarget, setDeleteTarget] = React.useState<Brand | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["brands", page], queryFn: () => listBrands({ page, limit: 20 }) });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brands"] }); toast({ title: "Brand deleted", variant: "success" }); setDeleteTarget(null); },
    onError: (e: Error) => toast({ title: "Cannot delete", description: e.message, variant: "danger" }),
  });

  const columns: Column<Brand>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "slug", header: "Slug", cell: (r) => <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{r.slug}</code> },
    { key: "status", header: "Status", cell: (r) => <Badge variant={r.isActive ? "success" : "default"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
    {
      key: "actions", header: "", className: "w-16",
      cell: (r) => <TableActions editHref={`/brands/${r.id}`} onDelete={() => setDeleteTarget(r)} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Brands"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Brands" }]}
        action={<Button asChild><Link href="/brands/new"><Plus className="mr-2 h-4 w-4" />New Brand</Link></Button>}
      />
      <DataTable columns={columns} data={data?.data ?? []} keyField="id" isLoading={isLoading} />
      {data?.meta && data.meta.totalPages > 1 && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete brand"
        description={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
