"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Skeleton, Textarea, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { getMerchantProfile, updateMerchantProfile } from "../../../lib/api/profile";
import { useAuthStore } from "../../../stores/auth-store";

const schema = z.object({
  storeName: z.string().min(2, "At least 2 characters"),
  phone: z.string().min(7, "Invalid phone"),
  description: z.string().optional(),
  address: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function MerchantProfilePage() {
  const qc = useQueryClient();
  const updateMerchant = useAuthStore((s) => s.updateMerchant);
  const { data: profile, isLoading } = useQuery({ queryKey: ["merchant-profile"], queryFn: getMerchantProfile });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (profile) reset({ storeName: profile.storeName, phone: profile.phone, description: (profile as any).description ?? "", address: (profile as any).address ?? "" });
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: updateMerchantProfile,
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["merchant-profile"] });
      updateMerchant(updated);
      toast({ title: "Profile updated", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader title="Store Profile" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Profile" }]} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <FormField label="Store Name" htmlFor="storeName" error={errors.storeName?.message} required>
          <Input id="storeName" {...register("storeName")} />
        </FormField>
        <FormField label="Phone" htmlFor="phone" error={errors.phone?.message} required>
          <Input id="phone" type="tel" {...register("phone")} />
        </FormField>
        <FormField label="Description" htmlFor="description">
          <Textarea id="description" rows={3} {...register("description")} />
        </FormField>
        <FormField label="Address" htmlFor="address">
          <Textarea id="address" rows={2} {...register("address")} />
        </FormField>
        <div>
          <Button type="submit" isLoading={mutation.isPending}>Save Profile</Button>
        </div>
      </form>
    </div>
  );
}
