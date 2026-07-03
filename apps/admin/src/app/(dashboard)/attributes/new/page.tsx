"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createAttribute } from "../../../../lib/api/catalog";
import { Plus, X } from "lucide-react";

type ValueRow = { value: string; colorHex: string };

export default function NewAttributePage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<"SELECT" | "COLOR" | "TEXT">("SELECT");
  const [values, setValues] = React.useState<ValueRow[]>([{ value: "", colorHex: "#000000" }]);

  const mutation = useMutation({
    mutationFn: () =>
      createAttribute({
        name,
        type,
        values: values
          .filter((v) => v.value.trim())
          .map((v) => ({ value: v.value.trim(), ...(type === "COLOR" ? { colorHex: v.colorHex } : {}) })),
      }),
    onSuccess: () => { toast({ title: "Attribute created", variant: "success" }); router.push("/attributes"); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  function addRow() { setValues((prev) => [...prev, { value: "", colorHex: "#000000" }]); }
  function removeRow(i: number) { setValues((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, patch: Partial<ValueRow>) {
    setValues((prev) => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader
        title="New Attribute"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Attributes", href: "/attributes" }, { label: "New" }]}
      />
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" placeholder="e.g. Color, Size, Material" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>

        <FormField label="Type" required>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SELECT">Select (text chips)</SelectItem>
              <SelectItem value="COLOR">Color (color swatches)</SelectItem>
              <SelectItem value="TEXT">Text (free entry)</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Values</p>
          <div className="flex flex-col gap-2">
            {values.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                {type === "COLOR" && (
                  <div className="relative">
                    <input
                      type="color"
                      value={row.colorHex}
                      onChange={(e) => updateRow(i, { colorHex: e.target.value })}
                      className="h-9 w-9 cursor-pointer rounded border border-border p-0.5"
                      title="Pick color"
                    />
                  </div>
                )}
                <Input
                  value={row.value}
                  onChange={(e) => updateRow(i, { value: e.target.value })}
                  placeholder={type === "COLOR" ? "e.g. Red, Navy Blue" : `Value ${i + 1}`}
                  className="flex-1"
                />
                {type === "COLOR" && (
                  <Input
                    value={row.colorHex}
                    onChange={(e) => updateRow(i, { colorHex: e.target.value })}
                    placeholder="#000000"
                    className="w-28 font-mono text-xs"
                  />
                )}
                {values.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addRow}>
            <Plus className="mr-1 h-3 w-3" /> Add Value
          </Button>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Create Attribute</Button>
        </div>
      </form>
    </div>
  );
}
