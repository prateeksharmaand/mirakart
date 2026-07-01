"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createProduct } from "../../../../lib/api/products";
import { listCategories, listBrands } from "../../../../lib/api/profile";
import { Plus, Trash2 } from "lucide-react";

const variantSchema = z.object({
  sku: z.string().min(1, "Required"),
  price: z.coerce.number().positive("Must be positive"),
  stock: z.coerce.number().int().min(0),
});

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  price: z.coerce.number().positive("Must be positive"),
  comparePrice: z.coerce.number().optional(),
  variants: z.array(variantSchema).min(1, "Add at least one variant"),
});
type FormValues = z.infer<typeof schema>;

export default function NewProductPage() {
  const router = useRouter();
  const { data: categories } = useQuery({ queryKey: ["merchant-categories"], queryFn: listCategories });
  const { data: brands } = useQuery({ queryKey: ["merchant-brands"], queryFn: listBrands });

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { variants: [{ sku: "", price: 0, stock: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { toast({ title: "Product created", variant: "success" }); router.push("/products"); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader title="Add Product" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Products", href: "/products" }, { label: "New" }]} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-6">

        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Basic Information</h2>
          <FormField label="Product Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </FormField>
          <FormField label="Description" htmlFor="description">
            <Textarea id="description" rows={4} {...register("description")} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category" htmlFor="categoryId">
              <Select onValueChange={(v) => setValue("categoryId", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Brand" htmlFor="brandId">
              <Select onValueChange={(v) => setValue("brandId", v)}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Base Price (₹)" htmlFor="price" error={errors.price?.message} required>
              <Input id="price" type="number" step="0.01" {...register("price")} />
            </FormField>
            <FormField label="Compare Price (₹)" htmlFor="comparePrice">
              <Input id="comparePrice" type="number" step="0.01" {...register("comparePrice")} />
            </FormField>
          </div>
        </div>

        {/* Variants */}
        <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Variants / Inventory</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: "", price: 0, stock: 0 })}>
              <Plus className="mr-1 h-3 w-3" />Add Variant
            </Button>
          </div>
          {errors.variants && <p className="text-xs text-danger">{errors.variants.message}</p>}
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
              <FormField label={i === 0 ? "SKU" : ""} htmlFor={`sku-${i}`} error={errors.variants?.[i]?.sku?.message}>
                <Input id={`sku-${i}`} placeholder="SKU-001" {...register(`variants.${i}.sku`)} />
              </FormField>
              <FormField label={i === 0 ? "Price (₹)" : ""} htmlFor={`price-${i}`} error={errors.variants?.[i]?.price?.message}>
                <Input id={`price-${i}`} type="number" step="0.01" {...register(`variants.${i}.price`)} />
              </FormField>
              <FormField label={i === 0 ? "Stock" : ""} htmlFor={`stock-${i}`} error={errors.variants?.[i]?.stock?.message}>
                <Input id={`stock-${i}`} type="number" {...register(`variants.${i}.stock`)} />
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
