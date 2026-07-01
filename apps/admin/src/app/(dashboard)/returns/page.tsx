"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { TableActions } from "../../../components/table-actions";
import { listReturns, type Return } from "../../../lib/api/returns";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  APPROVED: "success", PENDING: "warning", REJECTED: "danger", REFUNDED: "success",
};

export default function ReturnsPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["returns", page, status],
    queryFn: () => listReturns({ page, limit: 20, status: status === "all" ? undefined : status }),
  });

  const columns: Column<Return>[] = [
    {
      key: "return",
      header: "Return",
      cell: (r) => (
        <div>
          <p className="font-medium">Order #{r.order?.orderNumber ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : "—"}</p>
        </div>
      ),
    },
    { key: "merchant", header: "Merchant", cell: (r) => r.merchant?.storeName ?? "—" },
    { key: "reason", header: "Reason", cell: (r) => r.reason?.name ?? "—" },
    { key: "status", header: "Status", cell: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>{r.status}</Badge> },
    { key: "date", header: "Date", cell: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: "actions", header: "", className: "w-16",
      cell: (r) => <TableActions viewHref={`/returns/${r.id}`} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Returns" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Returns" }]} />
      <div className="flex gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
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
