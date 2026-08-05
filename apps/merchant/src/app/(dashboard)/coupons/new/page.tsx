"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Checkbox, FormField, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createCoupon } from "../../../../lib/api/coupons";

// Optional numeric fields intentionally skip `.positive()`/`.min()` here —
// an empty input coerces to 0, which would otherwise fail those checks and
// block submission just for leaving the field blank. 0/blank gets stripped
// to `undefined` in the mutation below instead; the backend DTO still
// validates a genuinely-entered invalid value.
const schema = z.object({
  code: z.string().min(3, "At least 3 characters"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().positive("Must be positive"),
  maxDiscountAmount: z.coerce.number().optional(),
  minOrderValue: z.coerce.number().optional(),
  usageLimit: z.coerce.number().int().optional(),
  perCustomerLimit: z.coerce.number().int().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function NewCouponPage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { discountType: "PERCENTAGE", isActive: true },
  });

  const discountType = watch("discountType");

  const mutation = useMutation({
    mutationFn: (v: FormValues) =>
      createCoupon({
        code: v.code.trim().toUpperCase(),
        discountType: v.discountType,
        discountValue: v.discountValue,
        maxDiscountAmount: v.maxDiscountAmount || undefined,
        minOrderValue: v.minOrderValue || undefined,
        usageLimit: v.usageLimit || undefined,
        perCustomerLimit: v.perCustomerLimit || undefined,
        isActive: v.isActive,
        startsAt: v.startsAt || undefined,
        expiresAt: v.expiresAt || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Coupon created", variant: "success" });
      router.push("/coupons");
    },
    onError: (e: Error) => toast({ title: "Failed to create coupon", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title="New Coupon"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Coupons", href: "/coupons" }, { label: "New" }]}
      />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Discount</h2>
          <FormField
            label="Coupon Code"
            htmlFor="code"
            error={errors.code?.message}
            hint="Customers will type this at checkout — shown in all caps."
            required
          >
            <Input id="code" placeholder="SAVE10" {...register("code")} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Discount Type" htmlFor="discountType" required>
              <Select value={discountType} onValueChange={(v) => setValue("discountType", v as "PERCENTAGE" | "FIXED")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage off</SelectItem>
                  <SelectItem value="FIXED">Fixed amount off</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label={discountType === "PERCENTAGE" ? "Discount (%)" : "Discount Amount (₹)"}
              htmlFor="discountValue"
              error={errors.discountValue?.message}
              required
            >
              <Input id="discountValue" type="number" step="0.01" min="0" {...register("discountValue")} />
            </FormField>
          </div>
          {discountType === "PERCENTAGE" && (
            <FormField
              label="Max Discount Amount (₹)"
              htmlFor="maxDiscountAmount"
              error={errors.maxDiscountAmount?.message}
              hint="Caps the discount for a percentage coupon. Leave blank for no cap."
            >
              <Input id="maxDiscountAmount" type="number" step="0.01" min="0" placeholder="Optional" {...register("maxDiscountAmount")} />
            </FormField>
          )}
          <FormField
            label="Minimum Order Value (₹)"
            htmlFor="minOrderValue"
            error={errors.minOrderValue?.message}
            hint="Minimum spend on your items required to use this coupon. Leave blank for no minimum."
          >
            <Input id="minOrderValue" type="number" step="0.01" min="0" placeholder="Optional" {...register("minOrderValue")} />
          </FormField>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Limits & Validity</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Total Usage Limit"
              htmlFor="usageLimit"
              error={errors.usageLimit?.message}
              hint="Total redemptions across all customers. Leave blank for unlimited."
            >
              <Input id="usageLimit" type="number" min="1" placeholder="Unlimited" {...register("usageLimit")} />
            </FormField>
            <FormField
              label="Per-Customer Limit"
              htmlFor="perCustomerLimit"
              error={errors.perCustomerLimit?.message}
              hint="How many times one customer can use it. Leave blank for unlimited."
            >
              <Input id="perCustomerLimit" type="number" min="1" placeholder="Unlimited" {...register("perCustomerLimit")} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Starts At" htmlFor="startsAt" hint="Leave blank to start immediately.">
              <Input id="startsAt" type="date" {...register("startsAt")} />
            </FormField>
            <FormField label="Expires At" htmlFor="expiresAt" hint="Leave blank for no expiry.">
              <Input id="expiresAt" type="date" {...register("expiresAt")} />
            </FormField>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isActive" checked={watch("isActive")} onCheckedChange={(v) => setValue("isActive", !!v)} />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Create Coupon</Button>
        </div>
      </form>
    </div>
  );
}
