"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../../components/page-header";
import { ProductImageManager } from "../../../../../components/product-image-manager";
import { getMerchantProduct, updateProduct } from "../../../../../lib/api/products";
import { listCategories, listBrands, listActiveTags } from "../../../../../lib/api/profile";

const PRODUCT_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "ARCHIVED"] as const;
type ProductStatus = typeof PRODUCT_STATUSES[number];

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Submit for Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

const MERCHANT_EDITABLE_STATUSES: ProductStatus[] = ["DRAFT", "PENDING_APPROVAL", "ARCHIVED"];

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "ARCHIVED"]),
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

  React.useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description ?? "",
        categoryId: product.category?.id,
        brandId: product.brand?.id,
        price: product.basePrice,
        comparePrice: product.compareAtPrice ?? undefined,
        status: (product.status as ProductStatus) ?? "DRAFT",
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
            <Select value={watch("status") ?? "DRAFT"} onValueChange={(v) => setValue("status", v as ProductStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MERCHANT_EDITABLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
                {/* Show current status read-only if it's admin-controlled */}
                {(["APPROVED", "REJECTED"] as ProductStatus[]).includes(watch("status")) && (
                  <SelectItem value={watch("status")} disabled>
                    {STATUS_LABELS[watch("status")]} (set by admin)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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
    </div>
  );
}
