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
import { listAttributesForAdmin, deleteAttribute, type Attribute } from "../../../lib/api/catalog";

export default function AttributesPage() {
  const [page, setPage] = React.useState(1);
  const [deleteTarget, setDeleteTarget] = React.useState<Attribute | null>(null);
  const [sortBy, setSortBy] = React.useState("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const qc = useQueryClient();

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const { data, isLoading } = useQuery({
    queryKey: ["attributes", page, sortBy, sortOrder],
    queryFn: () => listAttributesForAdmin({ page, limit: 10, sortBy, sortOrder }),
  });

  function handleSortChange(key: string) {
    if (sortBy === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortOrder("asc"); }
    setPage(1);
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAttribute(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attributes"] }); toast({ title: "Attribute deleted", variant: "success" }); setDeleteTarget(null); },
    onError: (e: Error) => toast({ title: "Cannot delete", description: e.message, variant: "danger" }),
  });

  const columns: Column<Attribute>[] = [
    {
      key: "sno",
      header: "S No",
      className: "w-12",
      cell: (_r, index) => (data?.meta ? (data.meta.page - 1) * data.meta.limit : 0) + index + 1,
    },
    { key: "name", header: "Name", sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Type", sortable: true, cell: (r) => <Badge variant="default">{r.type}</Badge> },
    {
      key: "values",
      header: "Values",
      cell: (r) => {
        const expanded = expandedIds.has(r.id);
        const remaining = r.values.length - 5;
        const shown = expanded ? r.values : r.values.slice(0, 5);
        return (
          <div className="flex flex-wrap items-center gap-1">
            {shown.map((v) => (
              <span key={v.id} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{v.value}</span>
            ))}
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => toggleExpand(r.id)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {expanded ? "Show less" : `+${remaining} more`}
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "actions", header: "Action", className: "w-16",
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
