"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Checkbox, FormField, Input, Label, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getBrand, updateBrand } from "../../../../lib/api/catalog";

const schema = z.object({
  name: z.string().min(1, "Required"),
  code: z.string().regex(/^[A-Z0-9]*$/, "Uppercase letters and numbers only").optional(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function EditBrandPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: brand, isLoading } = useQuery({ queryKey: ["brand", params.id], queryFn: () => getBrand(params.id) });
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  React.useEffect(() => { if (brand) reset({ name: brand.name, code: brand.code ?? "", isActive: brand.isActive }); }, [brand, reset]);
  const mutation = useMutation({
    mutationFn: (v: FormValues) => updateBrand(params.id, { ...v, code: v.code?.trim() || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brands"] }); toast({ title: "Updated", variant: "success" }); router.push("/brands"); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  return (
    <div className="flex flex-col gap-6 max-w-md">
      <PageHeader title="Edit Brand" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Brands", href: "/brands" }, { label: brand?.name ?? "" }]} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" {...register("name")} />
        </FormField>
        <FormField
          label="Product ID Code"
          htmlFor="code"
          error={errors.code?.message}
          hint="Used as the Product ID prefix, e.g. NIKE-000001."
        >
          <Input id="code" placeholder="e.g. NIKE" {...register("code")} onChange={(e) => setValue("code", e.target.value.toUpperCase())} />
        </FormField>
        <div className="flex items-center gap-2">
          <Checkbox id="isActive" checked={watch("isActive")} onCheckedChange={(v) => setValue("isActive", !!v)} />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
