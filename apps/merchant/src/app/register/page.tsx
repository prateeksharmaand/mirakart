"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, toast } from "@mirakart/ui";
import { merchantRegister } from "../../lib/api/auth";
import { useAuthStore } from "../../stores/auth-store";

const schema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  password: z.string().min(8, "At least 8 characters").regex(/(?=.*[A-Za-z])(?=.*\d)/, "Must include a letter and a number"),
});
type FormValues = z.infer<typeof schema>;

export default function MerchantRegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const data = await merchantRegister(values);
      setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, merchant: data.merchant });
      router.push("/pending");
    } catch (error) {
      toast({ title: "Registration failed", description: (error as Error).message, variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl font-bold">Mirakart</span>
            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">Seller</span>
          </div>
          <p className="text-sm text-muted-foreground">Create your seller account</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-8 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField label="Store Name" htmlFor="storeName" error={errors.storeName?.message} required>
              <Input id="storeName" placeholder="My Awesome Store" {...register("storeName")} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
              <Input id="email" type="email" {...register("email")} />
            </FormField>
            <FormField label="Phone" htmlFor="phone" error={errors.phone?.message} required>
              <Input id="phone" type="tel" {...register("phone")} />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password?.message} hint="Min 8 chars, include a letter and number" required>
              <Input id="password" type="password" {...register("password")} />
            </FormField>
            <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">Create Account</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
