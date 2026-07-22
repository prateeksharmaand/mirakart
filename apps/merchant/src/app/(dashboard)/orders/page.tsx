"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
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
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-orders", page, status, sortBy, sortOrder],
    queryFn: () =>
      listMerchantOrders({ page, limit: 20, status: status === "all" ? undefined : status, sortBy, sortOrder }),
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

  const columns: Column<MerchantOrder>[] = [
    {
      key: "orderNumber",
      header: "Order ID",
      sortable: true,
      cell: (r) => (
        <Link href={`/orders/${r.id}`} className="hover:text-primary">
          <p className="font-medium">#{r.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : "—"}</p>
        </Link>
      ),
    },
    {
      key: "product",
      header: "Product",
      cell: (r) => {
        const firstItem = r.items?.[0];
        if (!firstItem) return "—";
        const image = firstItem.product?.images[0]?.media.url;
        const extra = (r.items?.length ?? 0) - 1;
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-50">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ShoppingBag className="h-4 w-4 text-border" />
              )}
            </div>
            <div>
              <p className="max-w-[160px] truncate">{firstItem.productNameSnapshot}</p>
              <p className="text-xs text-muted-foreground font-mono">{firstItem.product?.productCode ?? "—"}</p>
              {extra > 0 && <p className="text-xs text-muted-foreground">+{extra} more</p>}
            </div>
          </div>
        );
      },
    },
    { key: "total", header: "Total", sortable: true, cell: (r) => formatCurrency(r.total) },
    { key: "status", header: "Status", sortable: true, cell: (r) => <StatusBadge status={r.status} /> },
    { key: "createdAt", header: "Date", sortable: true, cell: (r) => new Date(r.createdAt).toLocaleDateString() },
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
