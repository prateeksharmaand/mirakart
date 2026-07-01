"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, FormField, Input, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getAttribute, updateAttribute } from "../../../../lib/api/catalog";
import { Plus, X } from "lucide-react";

export default function EditAttributePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = React.useState("");
  const [values, setValues] = React.useState<string[]>([]);

  const { data: attr, isLoading } = useQuery({ queryKey: ["attribute", params.id], queryFn: () => getAttribute(params.id) });

  React.useEffect(() => {
    if (attr) { setName(attr.name); setValues(attr.values.map((v) => v.value)); }
  }, [attr]);

  function addValue() { setValues((prev) => [...prev, ""]); }
  function removeValue(i: number) { setValues((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateValue(i: number, v: string) { setValues((prev) => prev.map((x, idx) => idx === i ? v : x)); }

  const mutation = useMutation({
    mutationFn: () => updateAttribute(params.id, { name, values: values.filter(Boolean) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attributes"] }); toast({ title: "Updated", variant: "success" }); router.push("/attributes"); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader title="Edit Attribute" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Attributes", href: "/attributes" }, { label: attr?.name ?? "" }]} />
      <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <div>
          <p className="mb-2 text-sm font-medium">Values</p>
          <div className="flex flex-col gap-2">
            {values.map((v, i) => (
              <div key={i} className="flex gap-2">
                <Input value={v} onChange={(e) => updateValue(i, e.target.value)} placeholder={`Value ${i + 1}`} />
                {values.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeValue(i)}><X className="h-4 w-4" /></Button>
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addValue}>
            <Plus className="mr-1 h-3 w-3" />Add Value
          </Button>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
