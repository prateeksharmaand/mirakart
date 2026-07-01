"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, toast } from "@mirakart/ui";
import { merchantLogin } from "../../lib/api/auth";
import { useAuthStore } from "../../stores/auth-store";

const schema = z.object({ email: z.string().email(), password: z.string().min(1, "Required") });
type FormValues = z.infer<typeof schema>;

export default function MerchantLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const data = await merchantLogin(values.email, values.password);
      setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, merchant: data.merchant });
      if (data.merchant.status === "PENDING") {
        router.push("/pending");
      } else {
        router.push("/");
      }
    } catch (error) {
      toast({ title: "Login failed", description: (error as Error).message, variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl font-bold text-foreground">Mirakart</span>
            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">Seller</span>
          </div>
          <p className="text-sm text-muted-foreground">Sign in to your seller account</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-8 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            </FormField>
            <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">Sign in</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary font-medium">Register as seller</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
