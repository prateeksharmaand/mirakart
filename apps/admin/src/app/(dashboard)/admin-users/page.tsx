"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button, Badge, Pagination, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { ConfirmDialog } from "../../../components/confirm-dialog";
import { TableActions } from "../../../components/table-actions";
import { listAdminUsers, deleteAdminUser, type AdminUser } from "../../../lib/api/admin-users";

const STATUS_VARIANT: Record<string, "success" | "danger" | "warning" | "default"> = {
  ACTIVE: "success", SUSPENDED: "danger", INVITED: "warning",
};

export default function AdminUsersPage() {
  const [page, setPage] = React.useState(1);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUser | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => listAdminUsers({ page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Admin user deleted", variant: "success" });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "danger" }),
  });

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.firstName} {row.lastName}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { key: "role", header: "Role", cell: (row) => row.role?.name ?? (row.isSuperAdmin ? "Super Admin" : "—") },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={STATUS_VARIANT[row.status] ?? "default"}>{row.status}</Badge>,
    },
    {
      key: "lastLogin",
      header: "Last Login",
      cell: (row) => row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : "Never",
    },
    {
      key: "actions",
      header: "",
      className: "w-16",
      cell: (row) => (
        <TableActions
          editHref={`/admin-users/${row.id}`}
          onDelete={row.isSuperAdmin ? undefined : () => setDeleteTarget(row)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin Users"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Admin Users" }]}
        action={
          <Button asChild>
            <Link href="/admin-users/new"><Plus className="mr-2 h-4 w-4" />New Admin User</Link>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No admin users found"
      />

      {data?.meta && data.meta.totalPages > 1 && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete admin user"
        description={`Remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
