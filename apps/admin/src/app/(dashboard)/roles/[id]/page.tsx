"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, FormField, Input, Label, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getRole, updateRole, assignPermissions, listPermissions } from "../../../../lib/api/roles";

export default function EditRolePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const { data: role, isLoading } = useQuery({ queryKey: ["role", params.id], queryFn: () => getRole(params.id) });
  const { data: groups } = useQuery({ queryKey: ["permissions"], queryFn: listPermissions });

  React.useEffect(() => {
    if (role) {
      setName(role.name);
      setSelected(new Set(role.permissions?.map((p) => p.id) ?? []));
    }
  }, [role]);

  function toggle(id: string) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function toggleModule(ids: string[]) {
    const allChecked = ids.every((id) => selected.has(id));
    setSelected((prev) => { const s = new Set(prev); ids.forEach((id) => allChecked ? s.delete(id) : s.add(id)); return s; });
  }

  const mutation = useMutation({
    mutationFn: async () => {
      await updateRole(params.id, { name });
      await assignPermissions(params.id, Array.from(selected));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role updated", variant: "success" });
      router.push("/roles");
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader title="Edit Role" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Roles", href: "/roles" }, { label: "Edit" }]} />
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-white p-6">
            <FormField label="Role Name" htmlFor="name" required>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={role?.isSystem} />
            </FormField>
          </div>
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold">Permissions</h2>
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
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending}>Save Changes</Button>
          </div>
        </div>
      )}
    </div>
  );
}
