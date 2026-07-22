"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Badge, Button, Input, Pagination, PRODUCT_STATUS_LABELS, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatusBadge, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { listMerchantProducts, deleteProduct, type Product } from "../../../lib/api/products";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@mirakart/ui";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function MerchantProductsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [stockStatus, setStockStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-products", page, search, status, stockStatus, sortBy, sortOrder],
    queryFn: () =>
      listMerchantProducts({
        page,
        limit: 20,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        stockStatus: stockStatus === "all" ? undefined : (stockStatus as "LOW_STOCK" | "OUT_OF_STOCK"),
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["merchant-products"] }); toast({ title: "Product deleted", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const columns: Column<Product>[] = [
    {
      key: "productCode",
      header: "Product ID",
      cell: (r) => <span className="font-mono text-xs">{r.productCode}</span>,
    },
    {
      key: "name",
      header: "Product",
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-3">
          {r.images?.[0] && <img src={r.images[0].media.url} alt={r.name} className="h-10 w-10 rounded object-cover" />}
          <div>
            <p className="font-medium">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.category?.name ?? "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "basePrice", header: "Price", sortable: true, cell: (r) => <span className="font-medium">{formatCurrency(r.basePrice)}</span> },
    { key: "variants", header: "Variants", cell: (r) => r.variants?.length ?? 0 },
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
    { key: "status", header: "Status", sortable: true, cell: (r) => <StatusBadge status={r.status} labelOverrides={PRODUCT_STATUS_LABELS} /> },
    {
      key: "actions",
      header: "",
      className: "w-16",
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/products/${r.id}/edit`} className="flex items-center gap-2"><Pencil className="h-4 w-4" />Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteMutation.mutate(r.id)} className="text-danger focus:text-danger">
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Products"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Products" }]}
        action={<Button asChild><Link href="/products/new"><Plus className="mr-2 h-4 w-4" />Add Product</Link></Button>}
      />
      <div className="flex gap-3">
        <Input placeholder="Search products…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="APPROVED">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stockStatus} onValueChange={(v) => { setStockStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stock</SelectItem>
            <SelectItem value="LOW_STOCK">Low stock</SelectItem>
            <SelectItem value="OUT_OF_STOCK">Out of stock</SelectItem>
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
