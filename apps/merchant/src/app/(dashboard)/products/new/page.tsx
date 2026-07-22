"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createProduct, addVariant, updateVariantInventory } from "../../../../lib/api/products";
import { listCategories, listBrands, listActiveTags, listCategoryAttributes } from "../../../../lib/api/profile";
import { Plus, Trash2 } from "lucide-react";

const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  price: z.coerce.number().positive("Must be positive"),
  stock: z.coerce.number().int().min(0),
  // attributeId → attributeValueId mapping
  attrs: z.record(z.string(), z.string()).default({}),
});

const schema = z.object({
  name: z.string().min(3, "At least 3 characters"),
  description: z.string().min(10, "At least 10 characters").optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  basePrice: z.coerce.number().positive("Must be positive"),
  compareAtPrice: z.coerce.number().optional(),
  sku: z.string().optional(),
  status: z.enum(["DRAFT", "APPROVED"]).default("APPROVED"),
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
      status: "APPROVED",
      tagIds: [],
      variants: [{ sku: "", price: 0, stock: 0, attrs: {} }],
    },
  });

  const selectedTagIds = watch("tagIds");
  const selectedCategoryId = watch("categoryId");
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  const { data: attributes = [] } = useQuery({
    queryKey: ["category-attributes-merchant", selectedCategoryId],
    queryFn: () => listCategoryAttributes(selectedCategoryId!),
    enabled: !!selectedCategoryId,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
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

      for (const variant of values.variants) {
        const attributeValueIds = Object.values(variant.attrs ?? {}).filter(Boolean);
        const created = await addVariant(product.id, {
          sku: variant.sku,
          price: variant.price,
          attributeValueIds,
        });
        if (variant.stock > 0) {
          await updateVariantInventory(product.id, created.id, variant.stock);
        }
      }

      return product;
    },
    onSuccess: (product) => {
      toast({ title: "Product created — now add images", variant: "success" });
      router.push(`/products/${product.id}/edit`);
    },
    onError: (e: Error) => toast({ title: "Failed to create product", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title="Add New Product"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Products", href: "/products" }, { label: "New" }]}
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
              <Select onValueChange={(v) => {
                setValue("categoryId", v);
                // Clear variant attrs when category changes
                fields.forEach((_, i) => setValue(`variants.${i}.attrs`, {}));
              }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {"  ".repeat(c.depth)}
                      {c.depth > 0 ? "↳ " : ""}
                      {c.name}
                    </SelectItem>
                  ))}
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
            <FormField label="Status" htmlFor="status" hint="Published products go live immediately — no approval needed.">
              <Select defaultValue="APPROVED" onValueChange={(v) => setValue("status", v as "DRAFT" | "APPROVED")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Publish (live immediately)</SelectItem>
                  <SelectItem value="DRAFT">Save as Draft</SelectItem>
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
              <p className="text-xs text-foreground-muted mt-0.5">
                {selectedCategoryId
                  ? attributes.length > 0
                    ? `Showing ${attributes.length} attribute${attributes.length !== 1 ? "s" : ""} for this category.`
                    : "This category has no specific attributes."
                  : "Select a category above to load relevant attributes."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ sku: "", price: 0, stock: 0, attrs: {} })}
            >
              <Plus className="mr-1 h-3 w-3" /> Add Variant
            </Button>
          </div>

          {errors.variants?.message && <p className="text-xs text-danger">{errors.variants.message}</p>}

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3">
            <p className="text-xs font-medium text-foreground-muted">SKU</p>
            <p className="text-xs font-medium text-foreground-muted">Price (₹)</p>
            <p className="text-xs font-medium text-foreground-muted">Stock</p>
            <div />
          </div>

          {fields.map((field, i) => (
            <VariantRow
              key={field.id}
              index={i}
              control={control}
              register={register}
              errors={errors}
              attributes={attributes}
              setValue={setValue}
              watch={watch}
              canDelete={fields.length > 1}
              onDelete={() => remove(i)}
            />
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

// Separate component so useWatch is per-row without re-rendering siblings
function VariantRow({
  index, control, register, errors, attributes, setValue, watch, canDelete, onDelete,
}: {
  index: number;
  control: ReturnType<typeof useForm<FormValues>>["control"];
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors: ReturnType<typeof useForm<FormValues>>["formState"]["errors"];
  attributes: import("../../../../lib/api/profile").AttributeWithValues[];
  setValue: ReturnType<typeof useForm<FormValues>>["setValue"];
  watch: ReturnType<typeof useForm<FormValues>>["watch"];
  canDelete: boolean;
  onDelete: () => void;
}) {
  const attrsValue = useWatch({ control, name: `variants.${index}.attrs` }) ?? {};

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      {/* SKU / Price / Stock row */}
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
        <Input placeholder="SKU-001" {...register(`variants.${index}.sku`)} />
        <Input type="number" step="0.01" min="0" placeholder="0.00" {...register(`variants.${index}.price`)} />
        <Input type="number" min="0" placeholder="0" {...register(`variants.${index}.stock`)} />
        {canDelete ? (
          <Button type="button" variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        ) : <div className="w-9" />}
      </div>
      {/* Validation errors */}
      {(errors.variants?.[index]?.sku || errors.variants?.[index]?.price) && (
        <p className="text-xs text-danger">
          {errors.variants?.[index]?.sku?.message ?? errors.variants?.[index]?.price?.message}
        </p>
      )}
      {/* Attribute selects */}
      {attributes.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {attributes.map((attr) => (
            <FormField key={attr.id} label={attr.name}>
              <Select
                value={attrsValue[attr.id] ?? ""}
                onValueChange={(v) => setValue(`variants.${index}.attrs.${attr.id}`, v)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={`Select ${attr.name}`} />
                </SelectTrigger>
                <SelectContent>
                  {attr.values.map((val) => (
                    <SelectItem key={val.id} value={val.id}>
                      <span className="flex items-center gap-2">
                        {attr.type === "COLOR" && val.colorHex && (
                          <span
                            className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                            style={{ backgroundColor: val.colorHex }}
                          />
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
    </div>
  );
}
