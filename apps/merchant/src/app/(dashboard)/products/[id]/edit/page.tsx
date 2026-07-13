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
import { listCategories, listBrands, listActiveTags, listCategoryAttributes, type AttributeWithValues } from "../../../../../lib/api/profile";
import { Plus, Trash2, Check, X } from "lucide-react";

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

const MERCHANT_EDITABLE_STATUSES = ["DRAFT", "PENDING_APPROVAL", "ARCHIVED"] as const;
type MerchantStatus = typeof MERCHANT_EDITABLE_STATUSES[number];

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "ARCHIVED"]).optional(),
  tagIds: z.array(z.string()).default([]),
  dealEndsAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

// datetime-local inputs use "YYYY-MM-DDTHH:mm" in the browser's local timezone
function isoToDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: product, isLoading } = useQuery({
    queryKey: ["merchant-product", params.id],
    queryFn: () => getMerchantProduct(params.id),
  });
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
        status: (MERCHANT_EDITABLE_STATUSES as readonly string[]).includes(product.status)
          ? (product.status as MerchantStatus)
          : undefined,
        tagIds: product.tags?.map((pt) => pt.tag.id) ?? [],
        dealEndsAt: isoToDatetimeLocal(product.dealEndsAt),
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
      dealEndsAt: v.dealEndsAt ? new Date(v.dealEndsAt).toISOString() : null,
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
      <PageHeader
        title="Edit Product"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Products", href: "/products" }, { label: product?.name ?? "" }]}
      />

      <ProductImageManager productId={params.id} />

      {/* Main form — id lets the submit button live outside the form element */}
      <form id="product-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-6">
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
                <SelectContent>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Brand">
              <Select
                key={`brand-${watch("brandId")}-${brands?.length ?? 0}`}
                value={watch("brandId") ?? ""}
                onValueChange={(v) => setValue("brandId", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
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
          <FormField
            label="Deal Ends At"
            htmlFor="dealEndsAt"
            hint="Set this to run a time-limited deal — the product shows a countdown on the storefront until this time. Leave blank for a normal listing."
          >
            <div className="flex items-center gap-2">
              <Input id="dealEndsAt" type="datetime-local" {...register("dealEndsAt")} />
              {watch("dealEndsAt") && (
                <button
                  type="button"
                  onClick={() => setValue("dealEndsAt", "")}
                  className="shrink-0 text-xs text-foreground-muted hover:text-danger"
                >
                  Clear
                </button>
              )}
            </div>
          </FormField>
          <FormField label="Status">
            {isAdminControlled ? (
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
      </form>

      {/* Variants / Inventory — between Tags and action buttons */}
      <VariantsManager productId={params.id} categoryId={watch("categoryId") ?? product?.category?.id} />

      {/* Action buttons — linked to the form via form="product-form" */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" form="product-form" isLoading={mutation.isPending}>Save Changes</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variants Manager — reads from the same TanStack Query cache as the parent
// ---------------------------------------------------------------------------

function VariantsManager({ productId, categoryId }: { productId: string; categoryId?: string }) {
  const qc = useQueryClient();

  const { data: product } = useQuery({
    queryKey: ["merchant-product", productId],
    queryFn: () => getMerchantProduct(productId),
  });

  const effectiveCategoryId = categoryId ?? product?.category?.id;

  const { data: attributes = [] } = useQuery<AttributeWithValues[]>({
    queryKey: ["category-attributes-merchant", effectiveCategoryId],
    queryFn: () => listCategoryAttributes(effectiveCategoryId!),
    enabled: !!effectiveCategoryId,
    staleTime: 60_000,
  });

  const variants: ProductVariant[] = product?.variants ?? [];

  // Stock input values keyed by variant id — synced from API, locally editable
  const [stockInputs, setStockInputs] = React.useState<Record<string, string>>({});
  const [savingStock, setSavingStock] = React.useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Add-variant inline row state
  const [showAddRow, setShowAddRow] = React.useState(false);
  const [newSku, setNewSku] = React.useState("");
  const [newPrice, setNewPrice] = React.useState("");
  const [newStock, setNewStock] = React.useState("0");
  const [newAttrs, setNewAttrs] = React.useState<Record<string, string>>({});
  const [adding, setAdding] = React.useState(false);

  // Sync stock inputs whenever the API returns fresh variants
  React.useEffect(() => {
    setStockInputs((prev) => {
      const next: Record<string, string> = {};
      variants.forEach((v) => {
        // Keep local value if user is currently typing, otherwise use server value
        next[v.id] = prev[v.id] ?? String(v.inventory?.quantity ?? 0);
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants.length, product]);

  async function handleSaveStock(variantId: string) {
    const qty = parseInt(stockInputs[variantId] ?? "", 10);
    if (isNaN(qty) || qty < 0) return;
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;
    const serverQty = variant.inventory?.quantity ?? 0;
    if (qty === serverQty) return; // nothing changed
    setSavingStock((s) => ({ ...s, [variantId]: true }));
    try {
      await updateVariantInventory(productId, variantId, qty);
      await qc.invalidateQueries({ queryKey: ["merchant-product", productId] });
      toast({ title: "Stock updated", variant: "success" });
    } catch (e: unknown) {
      toast({ title: "Failed to update stock", description: (e as Error).message, variant: "danger" });
    } finally {
      setSavingStock((s) => ({ ...s, [variantId]: false }));
    }
  }

  async function handleDelete(variantId: string) {
    if (!confirm("Delete this variant? This cannot be undone.")) return;
    setDeletingId(variantId);
    try {
      await deleteVariant(productId, variantId);
      await qc.invalidateQueries({ queryKey: ["merchant-product", productId] });
      toast({ title: "Variant deleted", variant: "success" });
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
      const attributeValueIds = Object.values(newAttrs).filter(Boolean);
      const created = await addVariant(productId, {
        sku: newSku.trim(),
        price: parseFloat(newPrice),
        attributeValueIds,
      });
      const stock = parseInt(newStock, 10);
      if (stock > 0) await updateVariantInventory(productId, created.id, stock);
      await qc.invalidateQueries({ queryKey: ["merchant-product", productId] });
      setNewSku(""); setNewPrice(""); setNewStock("0"); setNewAttrs({});
      setShowAddRow(false);
      toast({ title: "Variant added", variant: "success" });
    } catch (e: unknown) {
      toast({ title: "Failed to add variant", description: (e as Error).message, variant: "danger" });
    } finally {
      setAdding(false);
    }
  }

  const hasRows = variants.length > 0 || showAddRow;

  return (
    <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
      {/* Header — matches new-product page format */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Variants / Inventory</h2>
          <p className="text-xs text-foreground-muted mt-0.5">Add at least one SKU with price and stock quantity.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => { setShowAddRow(true); setNewSku(""); setNewPrice(""); setNewStock("0"); }}
        >
          <Plus className="mr-1 h-3 w-3" /> Add Variant
        </Button>
      </div>

      {/* Column labels */}
      {hasRows && (
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3">
          <p className="text-xs font-medium text-foreground-muted">SKU</p>
          <p className="text-xs font-medium text-foreground-muted">Price (₹)</p>
          <p className="text-xs font-medium text-foreground-muted">Stock</p>
          <div />
        </div>
      )}

      {/* Existing variant rows */}
      {variants.map((v) => {
        const serverQty = v.inventory?.quantity ?? 0;
        const localQty = stockInputs[v.id] ?? String(serverQty);
        const isDirty = parseInt(localQty, 10) !== serverQty;
        const isSaving = savingStock[v.id] ?? false;
        const attrChips = v.attributeValues?.map((av) => ({
          name: av.attributeValue.attribute.name,
          value: av.attributeValue.value,
          colorHex: (av.attributeValue as { colorHex?: string | null }).colorHex ?? null,
        })) ?? [];
        return (
          <div key={v.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
              {/* SKU */}
              <div className="h-form flex items-center px-3 rounded-sm border border-border bg-background-light text-sm font-mono truncate">
                {v.sku}
              </div>
              {/* Price */}
              <div className="h-form flex items-center px-3 rounded-sm border border-border bg-background-light text-sm">
                ₹{Number(v.price).toFixed(2)}
              </div>
              {/* Stock */}
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="0"
                  value={localQty}
                  onChange={(e) => setStockInputs((s) => ({ ...s, [v.id]: e.target.value }))}
                  onBlur={() => handleSaveStock(v.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveStock(v.id); } }}
                  className={isDirty ? "border-primary" : ""}
                />
                {isSaving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
                )}
              </div>
              {/* Delete */}
              <button
                type="button"
                disabled={deletingId === v.id}
                onClick={() => handleDelete(v.id)}
                className="rounded p-1.5 hover:bg-danger/10 text-danger/50 hover:text-danger transition-colors disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {/* Attribute chips */}
            {attrChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-1">
                {attrChips.map((chip) => (
                  <span key={chip.name} className="flex items-center gap-1 rounded-full bg-background-light border border-border px-2 py-0.5 text-xs text-foreground-muted">
                    {chip.colorHex && (
                      <span className="h-3 w-3 rounded-full border border-border shrink-0" style={{ backgroundColor: chip.colorHex }} />
                    )}
                    {chip.name}: <strong className="text-foreground">{chip.value}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add-variant inline row */}
      {showAddRow && (
        <form onSubmit={handleAddVariant} className="rounded-lg border border-primary/40 bg-primary/5 p-3 flex flex-col gap-3">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
            <Input placeholder="SKU-001" value={newSku} onChange={(e) => setNewSku(e.target.value)} autoFocus required />
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
            <Input type="number" min="0" placeholder="0" value={newStock} onChange={(e) => setNewStock(e.target.value)} />
            <div className="flex items-center gap-1">
              <Button type="submit" size="icon" variant="ghost" isLoading={adding} className="h-form w-9 shrink-0">
                {!adding && <Check className="h-4 w-4 text-success" />}
              </Button>
              <button type="button" onClick={() => { setShowAddRow(false); setNewAttrs({}); }} className="rounded p-1.5 text-foreground-muted hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Attribute selects for new variant */}
          {attributes.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {attributes.map((attr) => (
                <FormField key={attr.id} label={attr.name}>
                  <Select
                    value={newAttrs[attr.id] ?? ""}
                    onValueChange={(v) => setNewAttrs((s) => ({ ...s, [attr.id]: v }))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder={`Select ${attr.name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {attr.values.map((val) => (
                        <SelectItem key={val.id} value={val.id}>
                          <span className="flex items-center gap-2">
                            {attr.type === "COLOR" && val.colorHex && (
                              <span className="inline-block h-3.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: val.colorHex }} />
                            )}
                            {val.value}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              ))}
            </div>
          )}
        </form>
      )}

      {/* Empty state */}
      {!hasRows && (
        <p className="text-sm text-foreground-muted text-center py-4 border border-dashed border-border rounded-lg">
          No variants yet — click "+ Add Variant" to add one.
        </p>
      )}
    </div>
  );
}
