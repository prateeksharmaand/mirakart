"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Lock } from "lucide-react";
import { Button, Badge, Pagination, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { ConfirmDialog } from "../../../components/confirm-dialog";
import { TableActions } from "../../../components/table-actions";
import { listRoles, deleteRole, type Role } from "../../../lib/api/roles";

export default function RolesPage() {
  const [page, setPage] = React.useState(1);
  const [deleteTarget, setDeleteTarget] = React.useState<Role | null>(null);
  const [sortBy, setSortBy] = React.useState("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["roles", page, sortBy, sortOrder],
    queryFn: () => listRoles({ page, limit: 10, sortBy, sortOrder }),
  });

  function handleSortChange(key: string) {
    if (sortBy === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortOrder("asc"); }
    setPage(1);
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); toast({ title: "Role deleted", variant: "success" }); setDeleteTarget(null); },
    onError: (e: Error) => toast({ title: "Cannot delete", description: e.message, variant: "danger" }),
  });

  const columns: Column<Role>[] = [
    {
      key: "sno",
      header: "S No",
      className: "w-12",
      cell: (_r, index) => (data?.meta ? (data.meta.page - 1) * data.meta.limit : 0) + index + 1,
    },
    { key: "name", header: "Name", sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "system", header: "Type", cell: (r) => r.isSystem ? <Badge variant="primary">System</Badge> : <Badge variant="default">Custom</Badge> },
    { key: "perms", header: "Permissions", cell: (r) => r.permissions?.length ?? "—" },
    {
      key: "actions", header: "Action", className: "w-16",
      cell: (r) => r.isSystem
        ? <Lock className="h-4 w-4 text-muted-foreground mx-auto" />
        : <TableActions editHref={`/roles/${r.id}`} onDelete={() => setDeleteTarget(r)} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles & Permissions"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Roles" }]}
        action={
          <Button asChild><Link href="/roles/new"><Plus className="mr-2 h-4 w-4" />New Role</Link></Button>
        }
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No roles found"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />
      {data?.meta && data.meta.totalPages > 1 && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete role"
        description={`Delete the "${deleteTarget?.name}" role? Admin users with this role will lose it.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
