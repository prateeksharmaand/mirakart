"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Lock } from "lucide-react";
import { Button, Badge, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { ConfirmDialog } from "../../../components/confirm-dialog";
import { TableActions } from "../../../components/table-actions";
import { listRoles, deleteRole, type Role } from "../../../lib/api/roles";

export default function RolesPage() {
  const [deleteTarget, setDeleteTarget] = React.useState<Role | null>(null);
  const qc = useQueryClient();

  const { data: roles, isLoading } = useQuery({ queryKey: ["roles"], queryFn: listRoles });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); toast({ title: "Role deleted", variant: "success" }); setDeleteTarget(null); },
    onError: (e: Error) => toast({ title: "Cannot delete", description: e.message, variant: "danger" }),
  });

  const columns: Column<Role>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "code", header: "Code", cell: (r) => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{r.code}</code> },
    { key: "system", header: "Type", cell: (r) => r.isSystem ? <Badge variant="primary">System</Badge> : <Badge variant="default">Custom</Badge> },
    { key: "perms", header: "Permissions", cell: (r) => r.permissions?.length ?? "—" },
    {
      key: "actions", header: "", className: "w-16",
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
      <DataTable columns={columns} data={roles ?? []} keyField="id" isLoading={isLoading} emptyMessage="No roles found" />
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
