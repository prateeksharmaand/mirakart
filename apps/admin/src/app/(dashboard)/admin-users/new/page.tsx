"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, PasswordInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createAdminUser } from "../../../../lib/api/admin-users";
import { listRoles } from "../../../../lib/api/roles";

const schema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(60, "Must be 60 characters or fewer"),
    lastName: z.string().min(1, "Last name is required").max(60, "Must be 60 characters or fewer"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "At least 8 characters")
      .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Must include a letter and a number"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
    roleId: z.string().min(1, "Role is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function NewAdminUserPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: rolesResult } = useQuery({ queryKey: ["roles"], queryFn: () => listRoles({ limit: 200 }) });
  const roles = rolesResult?.data;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const { confirmPassword: _confirmPassword, ...input } = v;
      return createAdminUser(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Admin user created", variant: "success" });
      router.push("/admin-users");
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader
        title="New Admin User"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Admin Users", href: "/admin-users" }, { label: "New" }]}
      />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" htmlFor="firstName" error={errors.firstName?.message} required>
            <Input id="firstName" {...register("firstName")} />
          </FormField>
          <FormField label="Last Name" htmlFor="lastName" error={errors.lastName?.message} required>
            <Input id="lastName" {...register("lastName")} />
          </FormField>
        </div>
        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input id="email" type="email" {...register("email")} />
        </FormField>
        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters, with a letter and a number"
          required
        >
          <PasswordInput id="password" {...register("password")} />
        </FormField>
        <FormField label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
          <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
        </FormField>
        <FormField label="Role" htmlFor="roleId" error={errors.roleId?.message} required>
          <Select onValueChange={(v) => setValue("roleId", v, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {roles?.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Create</Button>
        </div>
      </form>
    </div>
  );
}
