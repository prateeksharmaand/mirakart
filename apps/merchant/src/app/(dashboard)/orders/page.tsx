"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatusBadge } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { listMerchantOrders, type MerchantOrder } from "../../../lib/api/orders";
import Link from "next/link";

const ITEM_STATUSES = [
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
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function MerchantOrdersPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-orders", page, status],
    queryFn: () => listMerchantOrders({ page, limit: 20, status: status === "all" ? undefined : status }),
  });

  const columns: Column<MerchantOrder>[] = [
    {
      key: "order",
      header: "Order",
      cell: (r) => (
        <Link href={`/orders/${r.id}`} className="hover:text-primary">
          <p className="font-medium">#{r.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : "—"}</p>
        </Link>
      ),
    },
    { key: "total", header: "Total", cell: (r) => formatCurrency(r.total) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "date", header: "Date", cell: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Orders" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Orders" }]} />
      <div className="flex gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ITEM_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replaceAll("_", " ")}
              </SelectItem>
            ))}
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
