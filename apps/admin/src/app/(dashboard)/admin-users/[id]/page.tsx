"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getAdminUser, updateAdminUser } from "../../../../lib/api/admin-users";
import { listRoles } from "../../../../lib/api/roles";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  roleId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function EditAdminUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: user, isLoading } = useQuery({ queryKey: ["admin-user", params.id], queryFn: () => getAdminUser(params.id) });
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: listRoles });

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    if (user) {
      reset({ firstName: user.firstName, lastName: user.lastName, status: user.status as "ACTIVE" | "SUSPENDED", roleId: user.role?.id });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) => updateAdminUser(params.id, v),
    onSuccess: () => {
      toast({ title: "Updated", variant: "success" });
      router.push("/admin-users");
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader
        title="Edit Admin User"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Admin Users", href: "/admin-users" }, { label: "Edit" }]}
      />
      {isLoading ? (
        <div className="flex flex-col gap-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      ) : (
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" htmlFor="firstName" error={errors.firstName?.message} required>
              <Input id="firstName" {...register("firstName")} />
            </FormField>
            <FormField label="Last Name" htmlFor="lastName" error={errors.lastName?.message} required>
              <Input id="lastName" {...register("lastName")} />
            </FormField>
          </div>
          <FormField label="Status" htmlFor="status" error={errors.status?.message} required>
            <Select defaultValue={user?.status} onValueChange={(v) => setValue("status", v as "ACTIVE" | "SUSPENDED")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {!user?.isSuperAdmin && (
            <FormField label="Role" htmlFor="roleId">
              <Select defaultValue={user?.role?.id} onValueChange={(v) => setValue("roleId", v)}>
                <SelectTrigger><SelectValue placeholder="No role" /></SelectTrigger>
                <SelectContent>
                  {roles?.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>Save changes</Button>
          </div>
        </form>
      )}
    </div>
  );
}
