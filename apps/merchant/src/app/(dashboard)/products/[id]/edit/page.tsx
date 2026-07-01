"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../../components/page-header";
import { getMerchantProduct, updateProduct } from "../../../../../lib/api/products";
import { listCategories, listBrands } from "../../../../../lib/api/profile";

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
});
type FormValues = z.infer<typeof schema>;

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: product, isLoading } = useQuery({ queryKey: ["merchant-product", params.id], queryFn: () => getMerchantProduct(params.id) });
  const { data: categories } = useQuery({ queryKey: ["merchant-categories"], queryFn: listCategories });
  const { data: brands } = useQuery({ queryKey: ["merchant-brands"], queryFn: listBrands });

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description ?? "",
        categoryId: product.category?.id,
        brandId: product.brand?.id,
        price: product.price,
        comparePrice: product.comparePrice ?? undefined,
        status: (product.status as "ACTIVE" | "DRAFT" | "ARCHIVED") ?? "DRAFT",
      });
    }
  }, [product, reset]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) => updateProduct(params.id, v),
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
              <Select value={product?.category?.id} onValueChange={(v) => setValue("categoryId", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Brand">
              <Select value={product?.brand?.id} onValueChange={(v) => setValue("brandId", v)}>
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
            <Select value={product?.status} onValueChange={(v) => setValue("status", v as "ACTIVE" | "DRAFT" | "ARCHIVED")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
