"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { listMerchantReturns, type MerchantReturn, type ReturnStatus } from "../../../lib/api/returns";

const STATUS_VARIANT: Record<ReturnStatus, "success" | "warning" | "danger" | "default"> = {
  REQUESTED: "warning",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  AWAITING_SHIPMENT: "default",
  ITEM_RECEIVED: "default",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const STATUS_OPTIONS: { value: ReturnStatus; label: string }[] = [
  { value: "REQUESTED", label: "Requested" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "REJECTED", label: "Rejected" },
  { value: "AWAITING_SHIPMENT", label: "Awaiting Shipment" },
  { value: "ITEM_RECEIVED", label: "Item Received" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function MerchantReturnsPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-returns", page, status, sortBy, sortOrder],
    queryFn: () =>
      listMerchantReturns({ page, limit: 20, status: status === "all" ? undefined : status, sortBy, sortOrder }),
  });

  function handleSortChange(key: string) {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  }

  const hasActiveFilters = status !== "all";
  function handleResetFilters() {
    setStatus("all");
    setPage(1);
  }

  const columns: Column<MerchantReturn>[] = [
    {
      key: "sno",
      header: "S No",
      className: "w-12",
      cell: (_r, index) => (data?.meta ? (data.meta.page - 1) * data.meta.limit : 0) + index + 1,
    },
    {
      key: "returnNumber",
      header: "Return",
      sortable: true,
      cell: (r) => (
        <Link href={`/returns/${r.id}`} className="hover:text-primary">
          <p className="font-medium">Order #{r.order?.orderNumber ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : "—"}</p>
        </Link>
      ),
    },
    { key: "reason", header: "Reason", cell: (r) => r.reason?.reason ?? "—" },
    {
      key: "resolutionType",
      header: "Type",
      cell: (r) => <Badge variant="default">{r.resolutionType === "REPLACEMENT" ? "Replace" : "Refund"}</Badge>,
    },
    { key: "status", header: "Status", sortable: true, cell: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>{r.status.replaceAll("_", " ")}</Badge> },
    { key: "createdAt", header: "Date", sortable: true, cell: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Returns" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Returns" }]} />
      <div className="flex gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleResetFilters} disabled={!hasActiveFilters}>
          Clear Filters
        </Button>
      </div>
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
    </div>
  );
}
