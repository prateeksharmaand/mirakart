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
import { deleteCategory, listCategoriesForAdmin, type Category } from "../../../lib/api/catalog";

export default function CategoriesPage() {
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);
  const qc = useQueryClient();

  const { data: categories, isLoading } = useQuery({ queryKey: ["categories"], queryFn: listCategoriesForAdmin });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast({ title: "Category deleted", variant: "success" }); setDeleteTarget(null); },
    onError: (e: Error) => toast({ title: "Cannot delete", description: e.message, variant: "danger" }),
  });

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Name",
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
      key: "actions", header: "", className: "w-16",
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
      <DataTable columns={columns} data={categories ?? []} keyField="id" isLoading={isLoading} />
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
