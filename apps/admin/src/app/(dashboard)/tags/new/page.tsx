"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Checkbox, FormField, Input, Label, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createTag } from "../../../../lib/api/catalog";

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});
type FormValues = z.infer<typeof schema>;

export default function NewTagPage() {
  const router = useRouter();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, sortOrder: 0 },
  });

  const mutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => { toast({ title: "Tag created", variant: "success" }); router.push("/tags"); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <PageHeader title="New Tag" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Tags", href: "/tags" }, { label: "New" }]} />
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
          <Button type="submit" isLoading={mutation.isPending}>Create</Button>
        </div>
      </form>
    </div>
  );
}
