"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PRODUCT_STATUS_LABELS, Skeleton, StatusBadge } from "@mirakart/ui";
import { Button, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { ConfirmDialog } from "../../../../components/confirm-dialog";
import { activateProduct, getProduct, suspendProduct, type Product, type ProductVariant } from "../../../../lib/api/products";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function AdminProductDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [suspendOpen, setSuspendOpen] = React.useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["admin-product", params.id],
    queryFn: () => getProduct(params.id),
  });

  const suspendMutation = useMutation({
    mutationFn: () => suspendProduct(params.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-product", params.id] });
      toast({ title: "Product suspended", description: "Hidden from customers.", variant: "success" });
      setSuspendOpen(false);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const activateMutation = useMutation({
    mutationFn: () => activateProduct(params.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-product", params.id] });
      toast({ title: "Product reactivated", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <PageHeader
        title={product.name}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Products", href: "/products" }, { label: product.name }]}
        action={
          product.status === "SUSPENDED" ? (
            <Button onClick={() => activateMutation.mutate()} isLoading={activateMutation.isPending}>Reactivate</Button>
          ) : (
            <Button variant="danger" onClick={() => setSuspendOpen(true)}>Suspend</Button>
          )
        }
      />

      {/* Product details */}
      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={product.status} labelOverrides={PRODUCT_STATUS_LABELS} /></div>
        <div><p className="text-xs text-muted-foreground">Product ID</p><code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{product.productCode}</code></div>
        <div><p className="text-xs text-muted-foreground">Merchant</p><p className="text-sm">{product.merchant?.storeName ?? "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm">{product.category?.name ?? "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Brand</p><p className="text-sm">{product.brand?.name ?? "—"}</p></div>
        <div>
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="text-sm font-medium">{formatPrice(product.basePrice)}</p>
          {product.compareAtPrice ? <p className="text-xs line-through text-muted-foreground">{formatPrice(product.compareAtPrice)}</p> : null}
        </div>
        <div><p className="text-xs text-muted-foreground">Slug</p><code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{product.slug}</code></div>
        {product.rejectionReason && (
          <div className="col-span-2"><p className="text-xs text-muted-foreground">Rejection Reason</p><p className="text-sm text-danger">{product.rejectionReason}</p></div>
        )}
      </div>

      {/* Description */}
      {product.description && (
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-xs text-muted-foreground mb-1">Description</p>
          <p className="text-sm whitespace-pre-wrap">{product.description}</p>
        </div>
      )}

      {/* Variants / Inventory + Product Images */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {product.variants && product.variants.length > 0 && (
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold mb-4">Variants / Inventory</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-2 text-left font-medium">SKU</th>
                    <th className="pb-2 text-left font-medium">Price</th>
                    <th className="pb-2 text-left font-medium">Stock</th>
                    <th className="pb-2 text-left font-medium">Attributes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {product.variants.map((v: ProductVariant) => {
                    const attrs = v.attributeValues
                      ?.map((av) => `${av.attributeValue.attribute.name}: ${av.attributeValue.value}`)
                      .join(", ");
                    const stock = v.inventory?.quantity ?? 0;
                    return (
                      <tr key={v.id}>
                        <td className="py-2.5 pr-4 font-mono text-xs">{v.sku}</td>
                        <td className="py-2.5 pr-4">{formatPrice(Number(v.price))}</td>
                        <td className="py-2.5 pr-4">
                          <span className={stock === 0 ? "text-red-500" : ""}>{stock}</span>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">{attrs || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {product.images && product.images.length > 0 && (
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold mb-4">Product Images</h2>
            <div className="grid grid-cols-3 gap-3">
              {product.images.map((image) => (
                <div key={image.id} className="relative rounded-lg overflow-hidden border border-border" style={{ aspectRatio: "1" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.media?.url} alt="" className="w-full h-full object-cover" />
                  {image.isPrimary && (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={suspendOpen}
        title="Suspend product"
        description={`"${product.name}" will be hidden from customers immediately. This is a trust & safety override — the merchant manages everything else about this listing.`}
        confirmLabel="Suspend"
        isLoading={suspendMutation.isPending}
        onConfirm={() => suspendMutation.mutate()}
        onCancel={() => setSuspendOpen(false)}
      />
    </div>
  );
}
