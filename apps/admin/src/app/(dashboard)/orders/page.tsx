"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button, Input, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatusBadge } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { TableActions } from "../../../components/table-actions";
import { listOrders, type Order } from "../../../lib/api/orders";

const ORDER_STATUSES = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "ACCEPTED",
  "PROCESSING",
  "PACKED",
  "READY_TO_SHIP",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "FAILED_DELIVERY",
  "COD_REFUSED",
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function OrdersPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [paymentMethod, setPaymentMethod] = React.useState("all");
  const [paymentStatus, setPaymentStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, search, status, paymentMethod, paymentStatus, sortBy, sortOrder],
    queryFn: () =>
      listOrders({
        page,
        limit: 20,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        paymentMethod: paymentMethod === "all" ? undefined : (paymentMethod as "COD" | "ONLINE"),
        paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
        sortBy,
        sortOrder,
      }),
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

  const hasActiveFilters = search !== "" || status !== "all" || paymentMethod !== "all" || paymentStatus !== "all";
  function handleResetFilters() {
    setSearch("");
    setStatus("all");
    setPaymentMethod("all");
    setPaymentStatus("all");
    setPage(1);
  }

  const columns: Column<Order>[] = [
    {
      key: "sno",
      header: "S No",
      className: "w-12",
      cell: (_r, index) => (data?.meta ? (data.meta.page - 1) * data.meta.limit : 0) + index + 1,
    },
    {
      key: "orderNumber",
      header: "Order",
      sortable: true,
      cell: (r) => (
        <Link href={`/orders/${r.id}`} className="block hover:text-primary">
          <p className="font-medium">#{r.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : "—"}</p>
        </Link>
      ),
    },
    { key: "total", header: "Total", sortable: true, cell: (r) => <span className="font-medium">{formatCurrency(r.total)}</span> },
    { key: "status", header: "Status", sortable: true, cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "payment",
      header: "Payment",
      cell: (r) =>
        r.payment ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{r.payment.method}</span>
            <StatusBadge status={r.payment.status} />
          </div>
        ) : (
          "—"
        ),
    },
    { key: "createdAt", header: "Date", sortable: true, cell: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: "actions", header: "Action", className: "w-16",
      cell: (r) => <TableActions viewHref={`/orders/${r.id}`} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Orders" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Orders" }]} />
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search by order #…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-60 shrink-0"><SelectValue className="block min-w-0 truncate" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replaceAll("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setPage(1); }}>
          <SelectTrigger className="w-48 shrink-0"><SelectValue className="block min-w-0 truncate" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="COD">Cash on Delivery</SelectItem>
            <SelectItem value="ONLINE">Online</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v); setPage(1); }}>
          <SelectTrigger className="w-48 shrink-0"><SelectValue className="block min-w-0 truncate" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="CAPTURED">Captured</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
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
