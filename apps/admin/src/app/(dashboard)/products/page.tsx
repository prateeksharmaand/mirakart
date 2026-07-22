"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Input, Pagination, PRODUCT_STATUS_LABELS, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatusBadge } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { TableActions } from "../../../components/table-actions";
import { listProducts, type Product } from "../../../lib/api/products";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function ProductsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["products", page, search, status],
    queryFn: () => listProducts({ page, limit: 20, search: search || undefined, status: status === "all" ? undefined : status }),
  });

  const columns: Column<Product>[] = [
    {
      key: "product",
      header: "Product",
      cell: (r) => (
        <div className="flex items-center gap-3">
          {r.images?.[0] && (
            <img src={r.images[0].media.url} alt={r.name} className="h-10 w-10 rounded object-cover" />
          )}
          <div>
            <p className="font-medium">{r.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{r.productCode}</p>
            {r.merchant && <p className="text-xs text-muted-foreground">{r.merchant.storeName}</p>}
          </div>
        </div>
      ),
    },
    { key: "category", header: "Category", cell: (r) => r.category?.name ?? "—" },
    {
      key: "price",
      header: "Price",
      cell: (r) => (
        <div>
          <p className="font-medium">{formatPrice(r.basePrice)}</p>
          {r.compareAtPrice && <p className="text-xs text-muted-foreground line-through">{formatPrice(r.compareAtPrice)}</p>}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      cell: (r) =>
        r.isOutOfStock ? (
          <Badge variant="danger">Out of Stock</Badge>
        ) : r.isLowStock ? (
          <Badge variant="warning">Low — {r.stockCount}</Badge>
        ) : (
          <span className="text-sm">{r.stockCount ?? 0}</span>
        ),
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} labelOverrides={PRODUCT_STATUS_LABELS} /> },
    {
      key: "actions", header: "", className: "w-16",
      cell: (r) => <TableActions viewHref={`/products/${r.id}`} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Products" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Products" }]} />
      <div className="flex gap-3">
        <Input placeholder="Search products…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending Review</SelectItem>
            <SelectItem value="APPROVED">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
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
