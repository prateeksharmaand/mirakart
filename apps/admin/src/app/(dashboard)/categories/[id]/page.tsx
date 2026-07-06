"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Checkbox, FormField, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getCategory, updateCategory, listCategories, listAttributes, getCategoryAttributes, assignCategoryAttribute, removeCategoryAttribute } from "../../../../lib/api/catalog";
import { Trash2, Plus } from "lucide-react";

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

      {/* Category Attributes */}
      <CategoryAttributesPanel categoryId={params.id} />
    </div>
  );
}

function CategoryAttributesPanel({ categoryId }: { categoryId: string }) {
  const qc = useQueryClient();
  const [selectedAttributeId, setSelectedAttributeId] = React.useState<string>("");
  const [isRequired, setIsRequired] = React.useState(false);

  const { data: assigned = [], isLoading: loadingAssigned } = useQuery({
    queryKey: ["category-attributes", categoryId],
    queryFn: () => getCategoryAttributes(categoryId),
  });

  const { data: allAttrsRes } = useQuery({
    queryKey: ["attributes-all"],
    queryFn: () => listAttributes({ limit: 200 }),
  });
  const allAttrs = allAttrsRes?.data ?? [];

  const assignedIds = new Set(assigned.map((a) => a.attributeId));
  const unassigned = allAttrs.filter((a) => !assignedIds.has(a.id));

  const assignMutation = useMutation({
    mutationFn: () => assignCategoryAttribute(categoryId, { attributeId: selectedAttributeId, isRequired }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["category-attributes", categoryId] });
      setSelectedAttributeId("");
      setIsRequired(false);
      toast({ title: "Attribute assigned", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  const removeMutation = useMutation({
    mutationFn: (attributeId: string) => removeCategoryAttribute(categoryId, attributeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["category-attributes", categoryId] });
      toast({ title: "Attribute removed", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  return (
    <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold">Category Attributes</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Attributes assigned here will appear as variant selectors for merchants adding products in this category.
        </p>
      </div>

      {/* Assigned attributes list */}
      {loadingAssigned ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : assigned.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-foreground-muted">
          No attributes assigned — add one below.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {assigned.map((ca) => (
            <div key={ca.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{ca.attribute.name}</span>
                <span className="rounded bg-background-light px-2 py-0.5 text-xs text-foreground-muted uppercase tracking-wide">
                  {ca.attribute.type}
                </span>
                {ca.isRequired && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">Required</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMutation.mutate(ca.attributeId)}
                isLoading={removeMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add attribute row */}
      {unassigned.length > 0 && (
        <div className="flex items-end gap-3 pt-1">
          <div className="flex-1">
            <Label className="mb-1.5 block text-xs text-foreground-muted">Add Attribute</Label>
            <Select value={selectedAttributeId} onValueChange={setSelectedAttributeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an attribute…" />
              </SelectTrigger>
              <SelectContent>
                {unassigned.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                    <span className="ml-2 text-xs text-foreground-muted">({a.type})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Checkbox id="isRequired" checked={isRequired} onCheckedChange={(v) => setIsRequired(!!v)} />
            <Label htmlFor="isRequired" className="text-xs whitespace-nowrap">Required</Label>
          </div>
          <Button
            type="button"
            onClick={() => assignMutation.mutate()}
            disabled={!selectedAttributeId}
            isLoading={assignMutation.isPending}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Assign
          </Button>
        </div>
      )}
    </div>
  );
}
