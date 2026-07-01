"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, toast } from "@mirakart/ui";
import { AuthCard } from "../../components/auth-card";
import { forgotPassword } from "../../lib/api/auth";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await forgotPassword(values.email);
      setSubmitted(true);
    } catch (error) {
      toast({ title: "Something went wrong", description: (error as Error).message, variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Reset your password" description="We'll email you a link to reset your password.">
      {submitted ? (
        <p className="text-sm text-foreground-muted">
          If an account exists for that email, a reset link is on its way. Check your inbox.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
            <Input id="email" type="email" {...register("email")} />
          </FormField>
          <Button type="submit" size="lg" isLoading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-foreground-muted">
        <Link href="/login" className="text-primary">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
