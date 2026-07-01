"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Checkbox, FormField, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getBanner, updateBanner } from "../../../../lib/api/banners";

const schema = z.object({
  title: z.string().optional(),
  linkUrl: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function EditBannerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: banner, isLoading } = useQuery({ queryKey: ["banner", params.id], queryFn: () => getBanner(params.id) });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  React.useEffect(() => {
    if (banner) reset({ title: banner.title ?? "", linkUrl: banner.linkUrl ?? "", sortOrder: banner.sortOrder, isActive: banner.isActive });
  }, [banner, reset]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) => updateBanner(params.id, v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["banners"] }); toast({ title: "Updated", variant: "success" }); router.push("/banners"); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader title="Edit Banner" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Banners", href: "/banners" }, { label: "Edit" }]} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        {banner?.media && <img src={banner.media.url} alt="Banner" className="h-32 w-full rounded object-cover" />}
        <FormField label="Title" htmlFor="title"><Input id="title" {...register("title")} /></FormField>
        <FormField label="Link URL" htmlFor="linkUrl"><Input id="linkUrl" {...register("linkUrl")} /></FormField>
        <FormField label="Sort Order" htmlFor="sortOrder"><Input id="sortOrder" type="number" {...register("sortOrder")} /></FormField>
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
