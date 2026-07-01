"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, toast } from "@mirakart/ui";
import { AuthCard } from "../../components/auth-card";
import { resetPassword } from "../../lib/api/auth";

const schema = z.object({
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Must include a letter and a number"),
});
type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await resetPassword(token, values.password);
      toast({ title: "Password updated", description: "You can now sign in with your new password.", variant: "success" });
      router.push("/login");
    } catch (error) {
      toast({ title: "Couldn't reset password", description: (error as Error).message, variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthCard title="Invalid link">
        <p className="text-sm text-foreground-muted">
          This password reset link is missing or invalid.{" "}
          <Link href="/forgot-password" className="text-primary">
            Request a new one
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          label="New password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters, with a letter and a number"
          required
        >
          <Input id="password" type="password" {...register("password")} />
        </FormField>
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordForm />
    </React.Suspense>
  );
}
