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
  const [sortBy, setSortBy] = React.useState("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["brands", page], queryFn: () => listBrands({ page, limit: 20 }) });

  function handleSortChange(key: string) {
    if (sortBy === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortOrder("asc"); }
  }

  const sortedBrands = React.useMemo(() => {
    const rows = [...(data?.data ?? [])];
    rows.sort((a, b) => {
      const av = sortBy === "status" ? Number(a.isActive) : sortBy === "code" ? (a.code ?? "") : sortBy === "slug" ? a.slug : a.name;
      const bv = sortBy === "status" ? Number(b.isActive) : sortBy === "code" ? (b.code ?? "") : sortBy === "slug" ? b.slug : b.name;
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [data, sortBy, sortOrder]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brands"] }); toast({ title: "Brand deleted", variant: "success" }); setDeleteTarget(null); },
    onError: (e: Error) => toast({ title: "Cannot delete", description: e.message, variant: "danger" }),
  });

  const columns: Column<Brand>[] = [
    {
      key: "sno",
      header: "S No",
      className: "w-12",
      cell: (_r, index) => (data?.meta ? (data.meta.page - 1) * data.meta.limit : 0) + index + 1,
    },
    { key: "name", header: "Name", sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "slug", header: "Slug", sortable: true, cell: (r) => <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{r.slug}</code> },
    { key: "code", header: "Code", sortable: true, cell: (r) => <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{r.code ?? "—"}</code> },
    { key: "status", header: "Status", sortable: true, cell: (r) => <Badge variant={r.isActive ? "success" : "default"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
    {
      key: "actions", header: "Action", className: "w-16",
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
      <DataTable
        columns={columns}
        data={sortedBrands}
        keyField="id"
        isLoading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />
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
