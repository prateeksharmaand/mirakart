"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Checkbox, FormField, Input, Label, Skeleton, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getTag, updateTag } from "../../../../lib/api/catalog";

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});
type FormValues = z.infer<typeof schema>;

export default function EditTagPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: tag, isLoading } = useQuery({ queryKey: ["tag", params.id], queryFn: () => getTag(params.id) });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (tag) reset({ name: tag.name, description: tag.description ?? "", isActive: tag.isActive, sortOrder: tag.sortOrder });
  }, [tag, reset]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) => updateTag(params.id, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast({ title: "Updated", variant: "success" });
      router.push("/tags");
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <PageHeader title="Edit Tag" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Tags", href: "/tags" }, { label: tag?.name ?? "" }]} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" {...register("name")} />
        </FormField>
        <FormField label="Description" htmlFor="description">
          <Textarea id="description" rows={3} {...register("description")} />
        </FormField>
        <FormField label="Sort Order" htmlFor="sortOrder" error={errors.sortOrder?.message}>
          <Input id="sortOrder" type="number" min="0" {...register("sortOrder")} />
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
