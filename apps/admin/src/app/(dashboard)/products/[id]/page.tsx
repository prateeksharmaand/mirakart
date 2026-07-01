"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getProduct, updateProductStatus, type Product } from "../../../../lib/api/products";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  ACTIVE: "success", DRAFT: "warning", SUSPENDED: "danger", ARCHIVED: "default",
};

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = React.useState("");

  const { data: product, isLoading } = useQuery({ queryKey: ["product", params.id], queryFn: () => getProduct(params.id) });

  React.useEffect(() => { if (product) setNewStatus(product.status); }, [product]);

  const mutation = useMutation({
    mutationFn: (s: string) => updateProductStatus(params.id, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["product", params.id] }); toast({ title: "Status updated", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={product.name}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Products", href: "/products" }, { label: product.name }]}
      />

      <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={STATUS_VARIANT[product.status] ?? "default"}>{product.status}</Badge></div>
          <div><p className="text-xs text-muted-foreground">Merchant</p><p className="text-sm">{product.merchant?.storeName ?? "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm">{product.category?.name ?? "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Brand</p><p className="text-sm">{product.brand?.name ?? "—"}</p></div>
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-sm font-medium">{formatPrice(product.price)}</p>
            {product.comparePrice && <p className="text-xs line-through text-muted-foreground">{formatPrice(product.comparePrice)}</p>}
          </div>
          <div><p className="text-xs text-muted-foreground">Slug</p><code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{product.slug}</code></div>
        </div>

        {product.images && product.images.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Images</p>
            <div className="flex gap-2 flex-wrap">
              {product.images.map((img) => (
                <img key={img.id} src={img.media.url} alt={product.name} className="h-20 w-20 rounded object-cover border border-border" />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-sm font-medium">Update Status</p>
          <div className="flex gap-3">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => mutation.mutate(newStatus)} isLoading={mutation.isPending} disabled={newStatus === product.status}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
