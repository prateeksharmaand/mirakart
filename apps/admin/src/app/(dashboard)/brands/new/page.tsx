"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Checkbox, FormField, Input, Label, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createBrand } from "../../../../lib/api/catalog";

const schema = z.object({
  name: z.string().min(1, "Required"),
  code: z.string().regex(/^[A-Z0-9]*$/, "Uppercase letters and numbers only").optional(),
  isActive: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

export default function NewBrandPage() {
  const router = useRouter();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema), defaultValues: { isActive: true },
  });
  const mutation = useMutation({
    mutationFn: createBrand,
    onSuccess: () => { toast({ title: "Brand created", variant: "success" }); router.push("/brands"); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });
  return (
    <div className="flex flex-col gap-6 max-w-md">
      <PageHeader title="New Brand" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Brands", href: "/brands" }, { label: "New" }]} />
      <form
        onSubmit={handleSubmit((v) => mutation.mutate({ ...v, code: v.code?.trim() || undefined }))}
        className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4"
      >
        <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" {...register("name")} />
        </FormField>
        <FormField
          label="Product ID Code"
          htmlFor="code"
          error={errors.code?.message}
          hint="Used as the Product ID prefix, e.g. NIKE-000001. Auto-generated from the name if left blank."
        >
          <Input id="code" placeholder="e.g. NIKE" {...register("code")} onChange={(e) => setValue("code", e.target.value.toUpperCase())} />
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
