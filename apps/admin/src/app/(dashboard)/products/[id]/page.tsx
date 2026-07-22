"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FormField, Skeleton, StatusBadge, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { ProductImageManager } from "../../../../components/product-image-manager";
import { ConfirmDialog } from "../../../../components/confirm-dialog";
import {
  getProduct,
  approveProduct,
  rejectProduct,
  suspendProduct,
  activateProduct,
  archiveProduct,
  type Product,
  type ProductVariant,
} from "../../../../lib/api/products";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const rejectSchema = z.object({ rejectionReason: z.string().min(10, "Provide at least 10 characters") });
type RejectForm = z.infer<typeof rejectSchema>;

export default function AdminProductDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [suspendOpen, setSuspendOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["admin-product", params.id],
    queryFn: () => getProduct(params.id),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-product", params.id] });
  const onError = (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" });

  const approveMutation = useMutation({
    mutationFn: () => approveProduct(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Product approved", variant: "success" }); },
    onError,
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectProduct(params.id, reason),
    onSuccess: () => { invalidate(); toast({ title: "Product rejected", variant: "success" }); setRejectOpen(false); reset(); },
    onError,
  });

  const suspendMutation = useMutation({
    mutationFn: () => suspendProduct(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Product suspended", description: "Hidden from customers.", variant: "success" }); setSuspendOpen(false); },
    onError,
  });

  const activateMutation = useMutation({
    mutationFn: () => activateProduct(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Product activated", description: "Now visible to customers.", variant: "success" }); },
    onError,
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveProduct(params.id),
    onSuccess: () => { invalidate(); toast({ title: "Product archived", variant: "success" }); setArchiveOpen(false); },
    onError,
  });

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (!product) return <p>Product not found.</p>;

  const isPendingApproval = product.status === "PENDING_APPROVAL";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={product.name}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Products", href: "/products" }, { label: product.name }]}
        action={
          isPendingApproval ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(true)}>Reject</Button>
              <Button onClick={() => approveMutation.mutate()} isLoading={approveMutation.isPending}>Approve</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {product.status !== "ARCHIVED" && (
                <Button variant="outline" onClick={() => setArchiveOpen(true)}>Archive</Button>
              )}
              {product.status === "APPROVED" ? (
                <Button variant="danger" onClick={() => setSuspendOpen(true)}>Suspend</Button>
              ) : (
                <Button onClick={() => activateMutation.mutate()} isLoading={activateMutation.isPending}>Activate</Button>
              )}
            </div>
          )
        }
      />

      {/* Product details */}
      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={product.status} /></div>
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

      {/* Variants */}
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

      {/* Image management */}
      <ProductImageManager productId={params.id} />

      {/* Reject dialog */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-modal">
            <h2 className="mb-4 text-lg font-semibold">Reject Product</h2>
            <form onSubmit={handleSubmit((v) => rejectMutation.mutate(v.rejectionReason))}>
              <FormField label="Reason" htmlFor="rejectionReason" error={errors.rejectionReason?.message} required>
                <Textarea id="rejectionReason" rows={3} placeholder="Explain why this product is being rejected…" {...register("rejectionReason")} />
              </FormField>
              <div className="mt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => { setRejectOpen(false); reset(); }}>Cancel</Button>
                <Button type="submit" variant="danger" isLoading={rejectMutation.isPending}>Reject</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={suspendOpen}
        title="Suspend product"
        description={`"${product.name}" will be hidden from customers immediately. You can activate it again anytime.`}
        confirmLabel="Suspend"
        isLoading={suspendMutation.isPending}
        onConfirm={() => suspendMutation.mutate()}
        onCancel={() => setSuspendOpen(false)}
      />

      <ConfirmDialog
        open={archiveOpen}
        title="Archive product"
        description={`Archive "${product.name}"? It will no longer be visible to customers.`}
        confirmLabel="Archive"
        isLoading={archiveMutation.isPending}
        onConfirm={() => archiveMutation.mutate()}
        onCancel={() => setArchiveOpen(false)}
      />
    </div>
  );
}
