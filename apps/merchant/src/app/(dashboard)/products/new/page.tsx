"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createProduct, addVariant } from "../../../../lib/api/products";
import { listCategories, listBrands, listActiveTags } from "../../../../lib/api/profile";
import { Plus, Trash2 } from "lucide-react";

const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  price: z.coerce.number().positive("Must be positive"),
  stock: z.coerce.number().int().min(0),
});

const schema = z.object({
  name: z.string().min(3, "At least 3 characters"),
  description: z.string().min(10, "At least 10 characters").optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  basePrice: z.coerce.number().positive("Must be positive"),
  compareAtPrice: z.coerce.number().optional(),
  sku: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL"]).default("DRAFT"),
  tagIds: z.array(z.string()).default([]),
  variants: z.array(variantSchema).min(1, "Add at least one variant"),
});

type FormValues = z.infer<typeof schema>;

export default function NewProductPage() {
  const router = useRouter();
  const { data: categories } = useQuery({ queryKey: ["merchant-categories"], queryFn: listCategories });
  const { data: brands } = useQuery({ queryKey: ["merchant-brands"], queryFn: listBrands });
  const { data: tags } = useQuery({ queryKey: ["merchant-tags"], queryFn: listActiveTags });

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "DRAFT",
      tagIds: [],
      variants: [{ sku: "", price: 0, stock: 0 }],
    },
  });

  const selectedTagIds = watch("tagIds");

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Step 1: Create the product
      const product = await createProduct({
        name: values.name,
        description: values.description || undefined,
        categoryId: values.categoryId,
        brandId: values.brandId || undefined,
        basePrice: values.basePrice,
        compareAtPrice: values.compareAtPrice || undefined,
        sku: values.sku || undefined,
        status: values.status,
        tagIds: values.tagIds.length > 0 ? values.tagIds : undefined,
      });

      // Step 2: Add each variant (attributeValueIds defaults to [] since the form
      // doesn't collect attributes yet — merchants can edit these later)
      for (const variant of values.variants) {
        await addVariant(product.id, {
          sku: variant.sku,
          price: variant.price,
          attributeValueIds: [],
        });
      }

      return product;
    },
    onSuccess: () => {
      toast({ title: "Product created successfully", variant: "success" });
      router.push("/products");
    },
    onError: (e: Error) => toast({ title: "Failed to create product", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title="Add New Product"
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Products", href: "/products" },
          { label: "New" },
        ]}
      />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-6">

        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Basic Information</h2>

          <FormField label="Product Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </FormField>

          <FormField label="Description" htmlFor="description" error={errors.description?.message}>
            <Textarea id="description" rows={4} {...register("description")} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category" htmlFor="categoryId" error={errors.categoryId?.message} required>
              <Select onValueChange={(v) => setValue("categoryId", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Brand" htmlFor="brandId">
              <Select onValueChange={(v) => setValue("brandId", v)}>
                <SelectTrigger><SelectValue placeholder="Select brand (optional)" /></SelectTrigger>
                <SelectContent>
                  {brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
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

        {/* Pricing */}
        <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Base Price (₹)" htmlFor="basePrice" error={errors.basePrice?.message} required>
              <Input id="basePrice" type="number" step="0.01" min="0" {...register("basePrice")} />
            </FormField>
            <FormField label="Compare At Price (₹)" htmlFor="compareAtPrice" error={errors.compareAtPrice?.message}>
              <Input id="compareAtPrice" type="number" step="0.01" min="0" {...register("compareAtPrice")} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="SKU" htmlFor="sku">
              <Input id="sku" placeholder="Optional" {...register("sku")} />
            </FormField>
            <FormField label="Status" htmlFor="status">
              <Select defaultValue="DRAFT" onValueChange={(v) => setValue("status", v as "DRAFT" | "PENDING_APPROVAL")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Submit for Approval</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </div>

        {/* Variants */}
        <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Variants / Inventory</h2>
              <p className="text-xs text-foreground-muted mt-0.5">Add at least one SKU with price and stock quantity.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: "", price: 0, stock: 0 })}>
              <Plus className="mr-1 h-3 w-3" /> Add Variant
            </Button>
          </div>
          {errors.variants?.message && <p className="text-xs text-danger">{errors.variants.message}</p>}
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
              <FormField label={i === 0 ? "SKU" : ""} htmlFor={`sku-${i}`} error={errors.variants?.[i]?.sku?.message}>
                <Input id={`sku-${i}`} placeholder="SKU-001" {...register(`variants.${i}.sku`)} />
              </FormField>
              <FormField label={i === 0 ? "Price (₹)" : ""} htmlFor={`vp-${i}`} error={errors.variants?.[i]?.price?.message}>
                <Input id={`vp-${i}`} type="number" step="0.01" min="0" {...register(`variants.${i}.price`)} />
              </FormField>
              <FormField label={i === 0 ? "Stock" : ""} htmlFor={`stock-${i}`} error={errors.variants?.[i]?.stock?.message}>
                <Input id={`stock-${i}`} type="number" min="0" {...register(`variants.${i}.stock`)} />
              </FormField>
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="mb-0.5">
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Create Product</Button>
        </div>
      </form>
    </div>
  );
}
