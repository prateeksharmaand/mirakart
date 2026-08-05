"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { X } from "lucide-react";
import { Badge, Button, Input, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { TableActions } from "../../../components/table-actions";
import { listMerchants, type Merchant } from "../../../lib/api/merchants";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  APPROVED: "success", PENDING: "warning", REJECTED: "danger", SUSPENDED: "danger",
};

export default function MerchantsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["merchants", page, search, status, sortBy, sortOrder],
    queryFn: () =>
      listMerchants({ page, limit: 20, search: search || undefined, status: status === "all" ? undefined : status, sortBy, sortOrder }),
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

  const hasActiveFilters = search !== "" || status !== "all";
  function handleResetFilters() {
    setSearch("");
    setStatus("all");
    setPage(1);
  }

  const columns: Column<Merchant>[] = [
    {
      key: "sno",
      header: "S No",
      className: "w-12",
      cell: (_r, index) => (data?.meta ? (data.meta.page - 1) * data.meta.limit : 0) + index + 1,
    },
    {
      key: "storeName",
      header: "Store",
      sortable: true,
      cell: (r) => (
        <Link href={`/merchants/${r.id}`} className="block hover:text-primary">
          <p className="font-medium">{r.storeName}</p>
          <p className="text-xs text-muted-foreground">@{r.storeSlug}</p>
        </Link>
      ),
    },
    {
      key: "email",
      header: "Owner",
      sortable: true,
      cell: (r) => (
        <Link href={`/merchants/${r.id}`} className="block hover:text-primary">
          <p>{r.email}</p>
          <p className="text-xs text-muted-foreground">{r.phone}</p>
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>{r.status}</Badge>,
    },
    { key: "products", header: "Products", cell: (r) => r._count?.products ?? 0 },
    { key: "createdAt", header: "Joined", sortable: true, cell: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: "actions",
      header: "Action",
      className: "w-16",
      cell: (r) => <TableActions viewHref={`/merchants/${r.id}`} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Merchants" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Merchants" }]} />

      <div className="flex gap-3">
        <Input
          placeholder="Search by store name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={handleResetFilters}
          disabled={!hasActiveFilters}
          className="border-danger/30 text-danger hover:bg-danger/5 hover:text-danger"
        >
          <X className="mr-1.5 h-3.5 w-3.5" />
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
