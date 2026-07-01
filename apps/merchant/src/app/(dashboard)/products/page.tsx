"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Badge, Button, Input, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { listMerchantProducts, deleteProduct, type Product } from "../../../lib/api/products";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@mirakart/ui";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  ACTIVE: "success", DRAFT: "warning", SUSPENDED: "danger", ARCHIVED: "default",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function MerchantProductsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-products", page, search, status],
    queryFn: () => listMerchantProducts({ page, limit: 20, search: search || undefined, status: status === "all" ? undefined : status }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["merchant-products"] }); toast({ title: "Product deleted", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const columns: Column<Product>[] = [
    {
      key: "product",
      header: "Product",
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
    { key: "price", header: "Price", cell: (r) => <span className="font-medium">{formatCurrency(r.price)}</span> },
    { key: "variants", header: "Variants", cell: (r) => r.variants?.length ?? 0 },
    { key: "status", header: "Status", cell: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>{r.status}</Badge> },
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
            <SelectItem value="ACTIVE">Active</SelectItem>
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
