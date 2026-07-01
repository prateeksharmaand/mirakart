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
import { listAttributes, deleteAttribute, type Attribute } from "../../../lib/api/catalog";

export default function AttributesPage() {
  const [page, setPage] = React.useState(1);
  const [deleteTarget, setDeleteTarget] = React.useState<Attribute | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["attributes", page], queryFn: () => listAttributes({ page, limit: 20 }) });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAttribute(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attributes"] }); toast({ title: "Attribute deleted", variant: "success" }); setDeleteTarget(null); },
    onError: (e: Error) => toast({ title: "Cannot delete", description: e.message, variant: "danger" }),
  });

  const columns: Column<Attribute>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Type", cell: (r) => <Badge variant="default">{r.type}</Badge> },
    {
      key: "values",
      header: "Values",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.values.slice(0, 5).map((v) => (
            <span key={v.id} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{v.value}</span>
          ))}
          {r.values.length > 5 && <span className="text-xs text-muted-foreground">+{r.values.length - 5} more</span>}
        </div>
      ),
    },
    {
      key: "actions", header: "", className: "w-16",
      cell: (r) => <TableActions editHref={`/attributes/${r.id}`} onDelete={() => setDeleteTarget(r)} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attributes"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Attributes" }]}
        action={<Button asChild><Link href="/attributes/new"><Plus className="mr-2 h-4 w-4" />New Attribute</Link></Button>}
      />
      <DataTable columns={columns} data={data?.data ?? []} keyField="id" isLoading={isLoading} />
      {data?.meta && data.meta.totalPages > 1 && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete attribute"
        description={`Delete "${deleteTarget?.name}"? Products using this attribute may be affected.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
