"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Checkbox, FormField, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createCategory, listCategoriesForAdmin, uploadCategoryImage } from "../../../../lib/api/catalog";

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

export default function NewCategoryPage() {
  const router = useRouter();
  const { data: all } = useQuery({ queryKey: ["categories-all"], queryFn: listCategoriesForAdmin });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  const [iconMediaId, setIconMediaId] = React.useState<string | undefined>(undefined);
  const [iconPreview, setIconPreview] = React.useState<string | null>(null);
  const [bannerMediaId, setBannerMediaId] = React.useState<string | undefined>(undefined);
  const [bannerPreview, setBannerPreview] = React.useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = React.useState(false);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);

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
    mutationFn: (v: FormValues) => createCategory({ ...v, iconMediaId, bannerMediaId }),
    onSuccess: () => { toast({ title: "Category created", variant: "success" }); router.push("/categories"); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader title="New Category" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Categories", href: "/categories" }, { label: "New" }]} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" {...register("name")} />
        </FormField>
        <FormField label="Description" htmlFor="description">
          <Textarea id="description" rows={3} {...register("description")} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Icon Image" htmlFor="iconImage" hint="Small square image shown in category lists/nav.">
            {iconPreview && <img src={iconPreview} alt="Icon" className="mb-2 h-16 w-16 rounded object-cover" />}
            <Input id="iconImage" type="file" accept="image/*" onChange={handleIconChange} disabled={uploadingIcon} />
          </FormField>
          <FormField label="Banner Image" htmlFor="bannerImage" hint="Wide image shown at the top of the category page.">
            {bannerPreview && <img src={bannerPreview} alt="Banner" className="mb-2 h-16 w-full rounded object-cover" />}
            <Input id="bannerImage" type="file" accept="image/*" onChange={handleBannerChange} disabled={uploadingBanner} />
          </FormField>
        </div>
        <FormField label="Parent Category" htmlFor="parentId">
          <Select onValueChange={(v) => setValue("parentId", v === "none" ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (top-level)</SelectItem>
              {all?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
        <div className="flex items-center gap-2">
          <Checkbox id="isActive" checked={watch("isActive")} onCheckedChange={(v) => setValue("isActive", !!v)} />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Create</Button>
        </div>
      </form>
    </div>
  );
}
