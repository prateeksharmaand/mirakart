"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge, Button, Checkbox, FormField, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getCoupon, updateCoupon } from "../../../../lib/api/coupons";

// Optional numeric fields intentionally skip `.positive()`/`.min()` — an
// empty input coerces to 0, which would otherwise fail those checks and
// block submission just for leaving the field blank. Blank is stripped to
// `null` in the mutation below (explicitly clearing the field on update);
// the backend DTO still validates a genuinely-entered invalid value.
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

// datetime-local/date inputs use "YYYY-MM-DD" — ISO strings need trimming.
function isoToDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export default function EditCouponPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: coupon, isLoading } = useQuery({
    queryKey: ["coupon", params.id],
    queryFn: () => getCoupon(params.id),
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { discountType: "PERCENTAGE", isActive: true },
  });

  const discountType = watch("discountType");

  React.useEffect(() => {
    if (coupon) {
      reset({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount ?? undefined,
        minOrderValue: coupon.minOrderValue ?? undefined,
        usageLimit: coupon.usageLimit ?? undefined,
        perCustomerLimit: coupon.perCustomerLimit ?? undefined,
        isActive: coupon.isActive,
        startsAt: isoToDateInput(coupon.startsAt),
        expiresAt: isoToDateInput(coupon.expiresAt),
      });
    }
  }, [coupon, reset]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) =>
      updateCoupon(params.id, {
        code: v.code.trim().toUpperCase(),
        discountType: v.discountType,
        discountValue: v.discountValue,
        maxDiscountAmount: v.maxDiscountAmount || null,
        minOrderValue: v.minOrderValue || null,
        usageLimit: v.usageLimit || null,
        perCustomerLimit: v.perCustomerLimit || null,
        isActive: v.isActive,
        startsAt: v.startsAt || null,
        expiresAt: v.expiresAt || null,
      }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      qc.setQueryData(["coupon", params.id], updated);
      toast({ title: "Coupon updated", variant: "success" });
      router.push("/coupons");
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title="Edit Coupon"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Coupons", href: "/coupons" }, { label: coupon?.code ?? "" }]}
      />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Discount</h2>
            <div className="flex items-center gap-3 text-xs text-foreground-muted">
              <span>Used {coupon?.usedCount ?? 0} time{coupon?.usedCount === 1 ? "" : "s"}</span>
              <Badge variant={watch("isActive") ? "success" : "default"}>{watch("isActive") ? "Active" : "Inactive"}</Badge>
            </div>
          </div>
          <FormField
            label="Coupon Code"
            htmlFor="code"
            error={errors.code?.message}
            hint="Customers will type this at checkout — shown in all caps."
            required
          >
            <Input id="code" {...register("code")} />
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
          <Button type="submit" isLoading={mutation.isPending}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
