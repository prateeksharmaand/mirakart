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
import { deleteCategory, listCategoriesForAdmin, type Category } from "../../../lib/api/catalog";

export default function CategoriesPage() {
  const [page, setPage] = React.useState(1);
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);
  const [sortBy, setSortBy] = React.useState("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["categories", page, sortBy, sortOrder],
    queryFn: () => listCategoriesForAdmin({ page, limit: 10, sortBy, sortOrder }),
  });

  function handleSortChange(key: string) {
    if (sortBy === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortOrder("asc"); }
    setPage(1);
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast({ title: "Category deleted", variant: "success" }); setDeleteTarget(null); },
    onError: (e: Error) => toast({ title: "Cannot delete", description: e.message, variant: "danger" }),
  });

  const columns: Column<Category>[] = [
    {
      key: "sno",
      header: "S No",
      className: "w-12",
      cell: (_r, index) => (data?.meta ? (data.meta.page - 1) * data.meta.limit : 0) + index + 1,
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          {r.parent && <p className="text-xs text-muted-foreground">Under: {r.parent.name}</p>}
        </div>
      ),
    },
    { key: "slug", header: "Slug", cell: (r) => <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{r.slug}</code> },
    { key: "status", header: "Status", cell: (r) => <Badge variant={r.isActive ? "success" : "default"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
    {
      key: "actions", header: "Action", className: "w-16",
      cell: (r) => <TableActions editHref={`/categories/${r.id}`} onDelete={() => setDeleteTarget(r)} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Categories" }]}
        action={<Button asChild><Link href="/categories/new"><Plus className="mr-2 h-4 w-4" />New Category</Link></Button>}
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
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
        title="Delete category"
        description={`Delete "${deleteTarget?.name}"? Sub-categories and products in it may be affected.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
