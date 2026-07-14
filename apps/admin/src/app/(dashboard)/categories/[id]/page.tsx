"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button, Checkbox, FormField, Input, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Skeleton, Textarea, toast,
} from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import {
  getCategory, updateCategory, listCategoriesForAdmin, uploadCategoryImage,
  listAttributes, getCategoryAttributes,
  assignCategoryAttribute, removeCategoryAttribute,
} from "../../../../lib/api/catalog";
import { Trash2, Plus } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: category, isLoading, isError } = useQuery({
    queryKey: ["category", params.id],
    queryFn: () => getCategory(params.id),
  });

  // All categories for the parent selector (admin endpoint returns inactive ones too)
  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories-admin-all"],
    queryFn: listCategoriesForAdmin,
  });

  const {
    register, handleSubmit, setValue, watch, reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", isActive: false },
  });

  const [iconMediaId, setIconMediaId] = React.useState<string | undefined>(undefined);
  const [iconPreview, setIconPreview] = React.useState<string | null>(null);
  const [bannerMediaId, setBannerMediaId] = React.useState<string | undefined>(undefined);
  const [bannerPreview, setBannerPreview] = React.useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = React.useState(false);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);

  // Populate form once category data arrives
  React.useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description ?? "",
        parentId: category.parentId ?? undefined,
        isActive: category.isActive,
      });
      setIconMediaId(category.iconMedia?.id);
      setBannerMediaId(category.bannerMedia?.id);
    }
  }, [category, reset]);

  async function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconPreview(URL.createObjectURL(file));
    setUploadingIcon(true);
    try {
      const media = await uploadCategoryImage(file);
      setIconMediaId(media.id);
    } catch (err) {
      toast({ title: "Icon upload failed", description: (err as Error).message, variant: "danger" });
    } finally {
      setUploadingIcon(false);
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerPreview(URL.createObjectURL(file));
    setUploadingBanner(true);
    try {
      const media = await uploadCategoryImage(file);
      setBannerMediaId(media.id);
    } catch (err) {
      toast({ title: "Banner upload failed", description: (err as Error).message, variant: "danger" });
    } finally {
      setUploadingBanner(false);
    }
  }

  const mutation = useMutation({
    mutationFn: (v: FormValues) =>
      updateCategory(params.id, {
        name: v.name,
        description: v.description || undefined,
        parentId: v.parentId || undefined,
        isActive: v.isActive,
        iconMediaId,
        bannerMediaId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["categories-admin-all"] });
      qc.invalidateQueries({ queryKey: ["category", params.id] });
      toast({ title: "Category updated", variant: "success" });
      router.push("/categories");
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !category) {
    return (
      <div className="flex flex-col gap-4 max-w-xl">
        <PageHeader title="Edit Category" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Categories", href: "/categories" }]} />
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
          Category not found or failed to load.{" "}
          <button type="button" className="underline" onClick={() => router.push("/categories")}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const watchedParentId = watch("parentId");
  const watchedIsActive = watch("isActive");

  // Options for parent select: exclude current category and its descendants
  const parentOptions = allCategories.filter((c) => c.id !== params.id);

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader
        title="Edit Category"
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
      />

      <form
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="rounded-xl border border-border bg-white p-6 flex flex-col gap-5"
      >
        <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" placeholder="e.g. T-Shirts" {...register("name")} />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" rows={3} placeholder="Optional category description" {...register("description")} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Icon Image" htmlFor="iconImage" hint="Small square image shown in category lists/nav.">
            {(iconPreview ?? category.iconMedia?.url) && (
              <img src={iconPreview ?? category.iconMedia?.url} alt="Icon" className="mb-2 h-16 w-16 rounded object-cover" />
            )}
            <Input id="iconImage" type="file" accept="image/*" onChange={handleIconChange} disabled={uploadingIcon} />
          </FormField>
          <FormField label="Banner Image" htmlFor="bannerImage" hint="Wide image shown at the top of the category page.">
            {(bannerPreview ?? category.bannerMedia?.url) && (
              <img src={bannerPreview ?? category.bannerMedia?.url} alt="Banner" className="mb-2 h-16 w-full rounded object-cover" />
            )}
            <Input id="bannerImage" type="file" accept="image/*" onChange={handleBannerChange} disabled={uploadingBanner} />
          </FormField>
        </div>

        <FormField label="Parent Category" htmlFor="parentId">
          {/* key forces Select to re-render when the loaded value or options change */}
          <Select
            key={`parent-${watchedParentId ?? "none"}-${parentOptions.length}`}
            value={watchedParentId ?? "none"}
            onValueChange={(v) => setValue("parentId", v === "none" ? undefined : v, { shouldDirty: true })}
          >
            <SelectTrigger id="parentId">
              <SelectValue placeholder="None (top-level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (top-level)</SelectItem>
              {parentOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {!c.isActive && <span className="ml-1 text-xs text-foreground-muted">(inactive)</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <div className="flex items-center gap-3">
          <Checkbox
            id="isActive"
            checked={watchedIsActive}
            onCheckedChange={(v) => setValue("isActive", !!v, { shouldDirty: true })}
          />
          <Label htmlFor="isActive" className="cursor-pointer select-none">
            Active <span className="ml-1 text-xs text-foreground-muted">(visible on storefront)</span>
          </Label>
        </div>

        <div className="flex gap-3 pt-1 border-t border-border">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={mutation.isPending}
            disabled={
              !mutation.isPending &&
              !isDirty &&
              iconMediaId === category.iconMedia?.id &&
              bannerMediaId === category.bannerMedia?.id
            }
          >
            Save Changes
          </Button>
        </div>
      </form>

      {/* Category Attributes panel */}
      <CategoryAttributesPanel categoryId={params.id} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Category Attributes Panel
// ────────────────────────────────────────────────────────────────────────────

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
    mutationFn: () =>
      assignCategoryAttribute(categoryId, { attributeId: selectedAttributeId, isRequired }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["category-attributes", categoryId] });
      setSelectedAttributeId("");
      setIsRequired(false);
      toast({ title: "Attribute assigned", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Failed to assign", description: e.message, variant: "danger" }),
  });

  const removeMutation = useMutation({
    mutationFn: (attributeId: string) => removeCategoryAttribute(categoryId, attributeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["category-attributes", categoryId] });
      toast({ title: "Attribute removed", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Failed to remove", description: e.message, variant: "danger" }),
  });

  return (
    <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold">Category Attributes</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Attributes assigned here appear as variant selectors when merchants add products in this category.
        </p>
      </div>

      {loadingAssigned ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : assigned.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-foreground-muted">
          No attributes assigned yet — add one below.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
          {assigned.map((ca) => (
            <div key={ca.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-medium text-foreground">{ca.attribute.name}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-foreground-muted uppercase tracking-wide">
                  {ca.attribute.type}
                </span>
                {ca.isRequired ? (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Required
                  </span>
                ) : (
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-foreground-muted">
                    Optional
                  </span>
                )}
                <span className="text-xs text-foreground-muted">
                  {ca.attribute.values?.length ?? 0} value{(ca.attribute.values?.length ?? 0) !== 1 ? "s" : ""}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMutation.mutate(ca.attributeId)}
                isLoading={removeMutation.isPending}
                className="shrink-0 text-danger/60 hover:text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add attribute */}
      {allAttrs.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Add Attribute</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Select
                key={`add-attr-${unassigned.length}`}
                value={selectedAttributeId}
                onValueChange={setSelectedAttributeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={unassigned.length === 0 ? "All attributes assigned" : "Select an attribute…"} />
                </SelectTrigger>
                <SelectContent>
                  {unassigned.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        {a.name}
                        <span className="text-[11px] text-foreground-muted uppercase">({a.type})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="reqCheck"
                checked={isRequired}
                onCheckedChange={(v) => setIsRequired(!!v)}
                disabled={!selectedAttributeId}
              />
              <Label htmlFor="reqCheck" className="text-sm cursor-pointer select-none whitespace-nowrap">
                Required
              </Label>
            </div>
            <Button
              type="button"
              onClick={() => assignMutation.mutate()}
              disabled={!selectedAttributeId || unassigned.length === 0}
              isLoading={assignMutation.isPending}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Assign
            </Button>
          </div>
        </div>
      )}

      {allAttrs.length === 0 && (
        <p className="text-xs text-foreground-muted">
          No attributes exist yet.{" "}
          <a href="/attributes/new" className="text-primary underline">Create an attribute</a> first.
        </p>
      )}
    </div>
  );
}
