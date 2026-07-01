"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Checkbox, FormField, Input, Label, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createRole, listPermissions } from "../../../../lib/api/roles";

const schema = z.object({ name: z.string().min(1, "Required") });
type FormValues = z.infer<typeof schema>;

export default function NewRolePage() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const { data: groups } = useQuery({ queryKey: ["permissions"], queryFn: listPermissions });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function toggle(id: string) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function toggleModule(ids: string[]) {
    const allChecked = ids.every((id) => selected.has(id));
    setSelected((prev) => { const s = new Set(prev); ids.forEach((id) => allChecked ? s.delete(id) : s.add(id)); return s; });
  }

  const mutation = useMutation({
    mutationFn: (v: FormValues) => createRole({ name: v.name, permissionIds: Array.from(selected) }),
    onSuccess: () => { toast({ title: "Role created", variant: "success" }); router.push("/roles"); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader title="New Role" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Roles", href: "/roles" }, { label: "New" }]} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-white p-6">
          <FormField label="Role Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" placeholder="e.g. Catalog Manager" {...register("name")} />
          </FormField>
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Permissions</h2>
          <div className="flex flex-col gap-4">
            {groups?.map((group) => {
              const ids = group.permissions.map((p) => p.id);
              const allChecked = ids.every((id) => selected.has(id));
              return (
                <div key={group.module}>
                  <div className="mb-2 flex items-center gap-2">
                    <Checkbox checked={allChecked} onCheckedChange={() => toggleModule(ids)} id={`mod-${group.module}`} />
                    <Label htmlFor={`mod-${group.module}`} className="text-sm font-semibold capitalize">{group.module.replace("_", " ")}</Label>
                  </div>
                  <div className="ml-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {group.permissions.map((p) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} id={p.id} />
                        <Label htmlFor={p.id} className="text-xs capitalize">{p.action.toLowerCase()}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Create Role</Button>
        </div>
      </form>
    </div>
  );
}
