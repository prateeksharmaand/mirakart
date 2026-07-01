"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Input, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { TableActions } from "../../../components/table-actions";
import { listCustomers, type Customer } from "../../../lib/api/customers";

export default function CustomersPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["customers", page, search, status],
    queryFn: () => listCustomers({ page, limit: 20, search: search || undefined, status: status === "all" ? undefined : status }),
  });

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => (
        <div>
          <p className="font-medium">{r.firstName} {r.lastName}</p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    { key: "phone", header: "Phone", cell: (r) => r.phone ?? "—" },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge variant={r.status === "ACTIVE" ? "success" : "danger"}>{r.status}</Badge>,
    },
    { key: "joined", header: "Joined", cell: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: "actions",
      header: "",
      className: "w-16",
      cell: (r) => <TableActions viewHref={`/customers/${r.id}`} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customers" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Customers" }]} />
      <div className="flex gap-3">
        <Input placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={data?.data ?? []} keyField="id" isLoading={isLoading} />
      {data?.meta && data.meta.totalPages > 1 && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
