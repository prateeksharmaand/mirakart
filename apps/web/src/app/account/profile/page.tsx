"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent, FormField, Input, PasswordInput, Skeleton, toast } from "@mirakart/ui";
import { changePassword } from "../../../lib/api/auth";
import { fetchProfile, updateProfile } from "../../../lib/api/customers";
import { useAuthStore } from "../../../stores/auth-store";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(8, "At least 8 characters")
      .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Must include a letter and a number"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const updateCustomer = useAuthStore((s) => s.updateCustomer);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  React.useEffect(() => {
    if (profile) resetProfile({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone ?? "" });
  }, [profile, resetProfile]);

  async function onSaveProfile(values: ProfileFormValues) {
    setIsSavingProfile(true);
    try {
      const updated = await updateProfile(values);
      updateCustomer({ id: updated.id, email: updated.email, firstName: updated.firstName, lastName: updated.lastName });
      toast({ title: "Profile updated", variant: "success" });
    } catch (error) {
      toast({ title: "Couldn't update profile", description: (error as Error).message, variant: "danger" });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function onChangePassword(values: PasswordFormValues) {
    setIsSavingPassword(true);
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
      resetPassword(values);
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-medium text-foreground">My Profile</h1>
      <Card>
        <CardContent className="flex flex-col gap-8 pt-5">
          <form onSubmit={handleProfileSubmit(onSaveProfile)} className="flex max-w-md flex-col gap-4">
            <FormField label="Email">
              <Input value={profile?.email ?? ""} disabled />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First name" htmlFor="firstName" error={profileErrors.firstName?.message} required>
                <Input id="firstName" {...registerProfile("firstName")} />
              </FormField>
              <FormField label="Last name" htmlFor="lastName" error={profileErrors.lastName?.message} required>
                <Input id="lastName" {...registerProfile("lastName")} />
              </FormField>
            </div>
            <FormField label="Phone" htmlFor="phone" error={profileErrors.phone?.message}>
              <Input id="phone" {...registerProfile("phone")} />
            </FormField>
            <Button type="submit" className="w-fit" isLoading={isSavingProfile}>
              Save changes
            </Button>
          </form>

          <div className="border-t border-border pt-6">
            <h2 className="mb-4 text-sm font-medium text-foreground">Change Password</h2>
            <form onSubmit={handlePasswordSubmit(onChangePassword)} className="flex max-w-md flex-col gap-4">
              <FormField
                label="Current password"
                htmlFor="currentPassword"
                error={passwordErrors.currentPassword?.message}
                required
              >
                <PasswordInput id="currentPassword" {...registerPassword("currentPassword")} />
              </FormField>
              <FormField
                label="New password"
                htmlFor="newPassword"
                error={passwordErrors.newPassword?.message}
                hint="At least 8 characters, with a letter and a number"
                required
              >
                <PasswordInput id="newPassword" {...registerPassword("newPassword")} />
              </FormField>
              <FormField
                label="Confirm new password"
                htmlFor="confirmNewPassword"
                error={passwordErrors.confirmNewPassword?.message}
                required
              >
                <PasswordInput id="confirmNewPassword" {...registerPassword("confirmNewPassword")} />
              </FormField>
              <Button type="submit" className="w-fit" isLoading={isSavingPassword}>
                Update password
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
