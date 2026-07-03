"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge, Button, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../../components/page-header";
import { ProductImageManager } from "../../../../../components/product-image-manager";
import { getMerchantProduct, updateProduct, addVariant, deleteVariant, updateVariantInventory, type ProductVariant } from "../../../../../lib/api/products";
import { listCategories, listBrands, listActiveTags } from "../../../../../lib/api/profile";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

type ProductStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ARCHIVED";

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

const STATUS_VARIANT: Record<ProductStatus, "default" | "success" | "warning" | "danger"> = {
  APPROVED: "success", PENDING_APPROVAL: "warning", REJECTED: "danger", DRAFT: "default", ARCHIVED: "default",
};

// Only the statuses a merchant is allowed to set
const MERCHANT_EDITABLE_STATUSES = ["DRAFT", "PENDING_APPROVAL", "ARCHIVED"] as const;
type MerchantStatus = typeof MERCHANT_EDITABLE_STATUSES[number];

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().optional(),
  // Optional — omitted when the current status is admin-controlled (APPROVED/REJECTED)
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "ARCHIVED"]).optional(),
  tagIds: z.array(z.string()).default([]),
});
type FormValues = z.infer<typeof schema>;

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: product, isLoading } = useQuery({ queryKey: ["merchant-product", params.id], queryFn: () => getMerchantProduct(params.id) });
  const { data: categories } = useQuery({ queryKey: ["merchant-categories"], queryFn: listCategories });
  const { data: brands } = useQuery({ queryKey: ["merchant-brands"], queryFn: listBrands });
  const { data: tags } = useQuery({ queryKey: ["merchant-tags"], queryFn: listActiveTags });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "DRAFT", tagIds: [] },
  });

  const selectedTagIds = watch("tagIds") ?? [];

  const isAdminControlled = product?.status === "APPROVED" || product?.status === "REJECTED";

  React.useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description ?? "",
        categoryId: product.category?.id,
        brandId: product.brand?.id,
        price: product.basePrice,
        comparePrice: product.compareAtPrice ?? undefined,
        // Only pre-fill status for merchant-editable states; leave undefined for APPROVED/REJECTED
        status: (MERCHANT_EDITABLE_STATUSES as readonly string[]).includes(product.status)
          ? (product.status as MerchantStatus)
          : undefined,
        tagIds: product.tags?.map((pt) => pt.tag.id) ?? [],
      });
    }
  }, [product, reset]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) => updateProduct(params.id, {
      name: v.name,
      description: v.description,
      categoryId: v.categoryId,
      brandId: v.brandId,
      basePrice: v.price,
      compareAtPrice: v.comparePrice,
      status: v.status,
      tagIds: v.tagIds,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchant-products"] });
      toast({ title: "Product updated", variant: "success" });
      router.push("/products");
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader title="Edit Product" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Products", href: "/products" }, { label: product?.name ?? "" }]} />

      <ProductImageManager productId={params.id} />

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
          <FormField label="Product Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </FormField>
          <FormField label="Description" htmlFor="description">
            <Textarea id="description" rows={4} {...register("description")} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <Select
                key={`cat-${watch("categoryId")}-${categories?.length ?? 0}`}
                value={watch("categoryId") ?? ""}
                onValueChange={(v) => setValue("categoryId", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Brand">
              <Select
                key={`brand-${watch("brandId")}-${brands?.length ?? 0}`}
                value={watch("brandId") ?? ""}
                onValueChange={(v) => setValue("brandId", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>{brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Price (₹)" error={errors.price?.message} required>
              <Input type="number" step="0.01" {...register("price")} />
            </FormField>
            <FormField label="Compare Price (₹)">
              <Input type="number" step="0.01" {...register("comparePrice")} />
            </FormField>
          </div>
          <FormField label="Status">
            {isAdminControlled ? (
              // Admin has set this status — show read-only badge, merchant cannot override
              <div className="flex items-center gap-2 h-9">
                <Badge variant={STATUS_VARIANT[product!.status as ProductStatus]}>
                  {STATUS_LABELS[product!.status as ProductStatus]}
                </Badge>
                <span className="text-xs text-foreground-muted">(set by admin)</span>
              </div>
            ) : (
              <Select
                key={`status-${watch("status")}`}
                value={watch("status") ?? "DRAFT"}
                onValueChange={(v) => setValue("status", v as MerchantStatus)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MERCHANT_EDITABLE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Tags</h2>
            <p className="text-xs text-foreground-muted">Select tags that describe this product.</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      const next = isSelected
                        ? selectedTagIds.filter((id) => id !== tag.id)
                        : [...selectedTagIds, tag.id];
                      setValue("tagIds", next);
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background hover:border-primary hover:text-primary"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Save Changes</Button>
        </div>
      </form>

      <VariantsManager productId={params.id} variants={product?.variants ?? []} />
    </div>
  );
}

// --- Variants Manager (outside the form so it has independent state) ---

function VariantsManager({ productId, variants: initialVariants }: { productId: string; variants: ProductVariant[] }) {
  const qc = useQueryClient();
  const [variants, setVariants] = React.useState<ProductVariant[]>(initialVariants);
  const [editingStock, setEditingStock] = React.useState<Record<string, string>>({});
  const [savingStock, setSavingStock] = React.useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Sync when product reloads
  React.useEffect(() => { setVariants(initialVariants); }, [initialVariants]);

  // Add variant form state
  const [newSku, setNewSku] = React.useState("");
  const [newPrice, setNewPrice] = React.useState("");
  const [newStock, setNewStock] = React.useState("0");
  const [adding, setAdding] = React.useState(false);

  async function handleSaveStock(variant: ProductVariant) {
    const qty = parseInt(editingStock[variant.id] ?? "", 10);
    if (isNaN(qty) || qty < 0) return;
    setSavingStock((s) => ({ ...s, [variant.id]: true }));
    try {
      await updateVariantInventory(productId, variant.id, qty);
      setVariants((vs) => vs.map((v) => v.id === variant.id ? { ...v, inventory: { quantity: qty } } : v));
      setEditingStock((s) => { const n = { ...s }; delete n[variant.id]; return n; });
      qc.invalidateQueries({ queryKey: ["merchant-product", productId] });
    } catch (e: unknown) {
      toast({ title: "Failed to update stock", description: (e as Error).message, variant: "danger" });
    } finally {
      setSavingStock((s) => ({ ...s, [variant.id]: false }));
    }
  }

  async function handleDelete(variantId: string) {
    setDeletingId(variantId);
    try {
      await deleteVariant(productId, variantId);
      setVariants((vs) => vs.filter((v) => v.id !== variantId));
      qc.invalidateQueries({ queryKey: ["merchant-product", productId] });
    } catch (e: unknown) {
      toast({ title: "Failed to delete variant", description: (e as Error).message, variant: "danger" });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!newSku.trim() || !newPrice) return;
    setAdding(true);
    try {
      const created = await addVariant(productId, { sku: newSku.trim(), price: parseFloat(newPrice), attributeValueIds: [] });
      const stock = parseInt(newStock, 10);
      if (stock > 0) await updateVariantInventory(productId, created.id, stock);
      setVariants((vs) => [...vs, { ...created, inventory: { quantity: stock > 0 ? stock : 0 } }]);
      setNewSku(""); setNewPrice(""); setNewStock("0");
      qc.invalidateQueries({ queryKey: ["merchant-product", productId] });
      toast({ title: "Variant added", variant: "success" });
    } catch (e: unknown) {
      toast({ title: "Failed to add variant", description: (e as Error).message, variant: "danger" });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Variants / Inventory</h2>
          <p className="text-xs text-foreground-muted mt-0.5">Manage SKUs, prices, and stock quantities.</p>
        </div>
      </div>

      {variants.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-foreground-muted">
                <th className="pb-2 text-left font-medium">SKU</th>
                <th className="pb-2 text-left font-medium">Price</th>
                <th className="pb-2 text-left font-medium">Stock</th>
                <th className="pb-2 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {variants.map((v) => {
                const isEditing = v.id in editingStock;
                const currentStock = v.inventory?.quantity ?? 0;
                return (
                  <tr key={v.id} className="group">
                    <td className="py-2.5 pr-4 font-mono text-xs">{v.sku}</td>
                    <td className="py-2.5 pr-4">₹{Number(v.price).toFixed(2)}</td>
                    <td className="py-2.5 pr-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            className="h-7 w-20 text-xs"
                            value={editingStock[v.id]}
                            onChange={(e) => setEditingStock((s) => ({ ...s, [v.id]: e.target.value }))}
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7" isLoading={savingStock[v.id]} onClick={() => handleSaveStock(v)}>
                            {!savingStock[v.id] && <Check className="h-3.5 w-3.5 text-success" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingStock((s) => { const n = { ...s }; delete n[v.id]; return n; })}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={currentStock === 0 ? "text-danger" : ""}>{currentStock}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setEditingStock((s) => ({ ...s, [v.id]: String(currentStock) }))}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        isLoading={deletingId === v.id}
                        onClick={() => handleDelete(v.id)}>
                        {deletingId !== v.id && <Trash2 className="h-3.5 w-3.5 text-danger" />}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-foreground-muted text-center py-4">No variants yet. Add one below.</p>
      )}

      <form onSubmit={handleAddVariant} className="border-t border-border pt-4">
        <p className="text-xs font-medium mb-3">Add Variant</p>
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <FormField label="SKU" htmlFor="nv-sku">
            <Input id="nv-sku" placeholder="SKU-001" value={newSku} onChange={(e) => setNewSku(e.target.value)} required />
          </FormField>
          <FormField label="Price (₹)" htmlFor="nv-price">
            <Input id="nv-price" type="number" step="0.01" min="0" placeholder="0.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
          </FormField>
          <FormField label="Stock" htmlFor="nv-stock">
            <Input id="nv-stock" type="number" min="0" value={newStock} onChange={(e) => setNewStock(e.target.value)} />
          </FormField>
          <Button type="submit" variant="outline" size="sm" isLoading={adding} className="mb-0.5">
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </form>
    </div>
  );
}
