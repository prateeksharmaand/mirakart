"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Label,
  toast,
} from "@mirakart/ui";
import type { AddressInput } from "../lib/api/customers";
import type { CustomerAddress } from "../types/customer";

const schema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(1, "Required"),
  phone: z.string().min(7, "Enter a valid phone number"),
  line1: z.string().min(1, "Required"),
  line2: z.string().optional(),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  postalCode: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  isDefault: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export function AddressFormDialog({
  open,
  onOpenChange,
  address,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: CustomerAddress;
  onSubmit: (values: AddressInput) => Promise<unknown>;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (open) {
      reset(
        address
          ? {
              label: address.label ?? "",
              fullName: address.fullName,
              phone: address.phone,
              line1: address.line1,
              line2: address.line2 ?? "",
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
              isDefault: address.isDefault,
            }
          : { country: "India", isDefault: false },
      );
    }
  }, [open, address, reset]);

  async function handleFormSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...values,
        label: values.label || null,
        line2: values.line2 || null,
        type: "BOTH",
        isDefault: values.isDefault ?? false,
      });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Couldn't save address", description: (error as Error).message, variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{address ? "Edit address" : "Add address"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Label" htmlFor="label">
              <Input id="label" placeholder="Home, Work..." {...register("label")} />
            </FormField>
            <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message} required>
              <Input id="fullName" {...register("fullName")} />
            </FormField>
          </div>
          <FormField label="Phone" htmlFor="phone" error={errors.phone?.message} required>
            <Input id="phone" {...register("phone")} />
          </FormField>
          <FormField label="Address line 1" htmlFor="line1" error={errors.line1?.message} required>
            <Input id="line1" {...register("line1")} />
          </FormField>
          <FormField label="Address line 2" htmlFor="line2">
            <Input id="line2" {...register("line2")} />
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="City" htmlFor="city" error={errors.city?.message} required>
              <Input id="city" {...register("city")} />
            </FormField>
            <FormField label="State" htmlFor="state" error={errors.state?.message} required>
              <Input id="state" {...register("state")} />
            </FormField>
            <FormField label="Postal code" htmlFor="postalCode" error={errors.postalCode?.message} required>
              <Input id="postalCode" {...register("postalCode")} />
            </FormField>
          </div>
          <FormField label="Country" htmlFor="country" error={errors.country?.message} required>
            <Input id="country" {...register("country")} />
          </FormField>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isDefault"
              checked={watch("isDefault")}
              onCheckedChange={(checked) => setValue("isDefault", checked === true)}
            />
            <Label htmlFor="isDefault">Set as default address</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
