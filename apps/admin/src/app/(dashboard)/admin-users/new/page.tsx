"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createAdminUser } from "../../../../lib/api/admin-users";
import { listRoles } from "../../../../lib/api/roles";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters"),
  roleId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function NewAdminUserPage() {
  const router = useRouter();
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: listRoles });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
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
        <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
          <Input id="password" type="password" {...register("password")} />
        </FormField>
        <FormField label="Role" htmlFor="roleId">
          <Select onValueChange={(v) => setValue("roleId", v)}>
            <SelectTrigger><SelectValue placeholder="Select role (optional)" /></SelectTrigger>
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
