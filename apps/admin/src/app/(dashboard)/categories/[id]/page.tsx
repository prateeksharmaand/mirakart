"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Checkbox, FormField, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getCategory, updateCategory, listCategories } from "../../../../lib/api/catalog";

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: category, isLoading } = useQuery({ queryKey: ["category", params.id], queryFn: () => getCategory(params.id) });
  const { data: all } = useQuery({ queryKey: ["categories-all"], queryFn: () => listCategories({ limit: 200 }) });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (category) reset({ name: category.name, description: category.description ?? "", parentId: category.parentId ?? undefined, isActive: category.isActive });
  }, [category, reset]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) => updateCategory(params.id, v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast({ title: "Updated", variant: "success" }); router.push("/categories"); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader title="Edit Category" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Categories", href: "/categories" }, { label: category?.name ?? "" }]} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" {...register("name")} />
        </FormField>
        <FormField label="Description" htmlFor="description">
          <Textarea id="description" rows={3} {...register("description")} />
        </FormField>
        <FormField label="Parent Category" htmlFor="parentId">
          <Select value={watch("parentId") ?? "none"} onValueChange={(v) => setValue("parentId", v === "none" ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (top-level)</SelectItem>
              {all?.data.filter((c) => c.id !== params.id).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
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
