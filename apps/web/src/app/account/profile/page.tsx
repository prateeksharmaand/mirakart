"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent, FormField, Input, Skeleton, toast } from "@mirakart/ui";
import { changePassword } from "../../../lib/api/auth";
import { fetchProfile, updateProfile } from "../../../lib/api/customers";
import { useAuthStore } from "../../../stores/auth-store";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Must include a letter and a number"),
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

function ChangePasswordCard() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(values: PasswordFormValues) {
    setIsSubmitting(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      toast({
        title: "Password updated",
        description: "Please sign in again with your new password.",
        variant: "success",
      });
      clearAuth();
      router.push("/login");
    } catch (error) {
      toast({ title: "Couldn't update password", description: (error as Error).message, variant: "danger" });
      reset(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-medium text-foreground">Change Password</h2>
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4">
            <FormField
              label="Current password"
              htmlFor="currentPassword"
              error={errors.currentPassword?.message}
              required
            >
              <Input id="currentPassword" type="password" {...register("currentPassword")} />
            </FormField>
            <FormField
              label="New password"
              htmlFor="newPassword"
              error={errors.newPassword?.message}
              hint="At least 8 characters, with a letter and a number"
              required
            >
              <Input id="newPassword" type="password" {...register("newPassword")} />
            </FormField>
            <Button type="submit" className="w-fit" isLoading={isSubmitting}>
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const updateCustomer = useAuthStore((s) => s.updateCustomer);
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (profile) reset({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone ?? "" });
  }, [profile, reset]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const updated = await updateProfile(values);
      updateCustomer({ id: updated.id, email: updated.email, firstName: updated.firstName, lastName: updated.lastName });
      toast({ title: "Profile updated", variant: "success" });
    } catch (error) {
      toast({ title: "Couldn't update profile", description: (error as Error).message, variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-medium text-foreground">My Profile</h1>
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4">
            <FormField label="Email">
              <Input value={profile?.email ?? ""} disabled />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First name" htmlFor="firstName" error={errors.firstName?.message} required>
                <Input id="firstName" {...register("firstName")} />
              </FormField>
              <FormField label="Last name" htmlFor="lastName" error={errors.lastName?.message} required>
                <Input id="lastName" {...register("lastName")} />
              </FormField>
            </div>
            <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" {...register("phone")} />
            </FormField>
            <Button type="submit" className="w-fit" isLoading={isSubmitting}>
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <ChangePasswordCard />
    </div>
  );
}
