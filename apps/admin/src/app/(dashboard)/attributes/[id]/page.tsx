"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, FormField, Input, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getAttribute, updateAttribute, addAttributeValue, deleteAttributeValue } from "../../../../lib/api/catalog";
import { Plus, X } from "lucide-react";

export default function EditAttributePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: attr, isLoading } = useQuery({
    queryKey: ["attribute", params.id],
    queryFn: () => getAttribute(params.id),
  });

  const [name, setName] = React.useState("");
  const [newValue, setNewValue] = React.useState("");
  const [newColorHex, setNewColorHex] = React.useState("#000000");
  const [addingValue, setAddingValue] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (attr) setName(attr.name);
  }, [attr]);

  const saveName = useMutation({
    mutationFn: () => updateAttribute(params.id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attributes"] });
      qc.invalidateQueries({ queryKey: ["attribute", params.id] });
      toast({ title: "Name updated", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  async function handleAddValue(e: React.FormEvent) {
    e.preventDefault();
    if (!newValue.trim()) return;
    setAddingValue(true);
    try {
      await addAttributeValue(params.id, {
        value: newValue.trim(),
        ...(attr?.type === "COLOR" ? { colorHex: newColorHex } : {}),
      });
      await qc.invalidateQueries({ queryKey: ["attribute", params.id] });
      setNewValue(""); setNewColorHex("#000000");
      toast({ title: "Value added", variant: "success" });
    } catch (e: unknown) {
      toast({ title: "Failed", description: (e as Error).message, variant: "danger" });
    } finally {
      setAddingValue(false);
    }
  }

  async function handleRemoveValue(valueId: string) {
    setRemovingId(valueId);
    try {
      await deleteAttributeValue(params.id, valueId);
      await qc.invalidateQueries({ queryKey: ["attribute", params.id] });
      toast({ title: "Value removed", variant: "success" });
    } catch (e: unknown) {
      toast({ title: "Cannot remove", description: (e as Error).message, variant: "danger" });
    } finally {
      setRemovingId(null);
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!attr) return <p>Attribute not found.</p>;

  const isColor = attr.type === "COLOR";

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader
        title="Edit Attribute"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Attributes", href: "/attributes" }, { label: attr.name }]}
      />

      {/* Name */}
      <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground-muted">Type: <strong>{attr.type}</strong></span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => saveName.mutate()}
            isLoading={saveName.isPending}
            disabled={name === attr.name}
          >
            Save Name
          </Button>
        </div>
      </div>

      {/* Values */}
      <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold">Values</h2>

        <div className="flex flex-col gap-2">
          {attr.values.length === 0 && (
            <p className="text-xs text-foreground-muted">No values yet.</p>
          )}
          {attr.values.map((v) => (
            <div key={v.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
              {isColor && v.colorHex && (
                <span
                  className="h-5 w-5 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: v.colorHex }}
                />
              )}
              <span className="flex-1 text-sm">{v.value}</span>
              {isColor && v.colorHex && (
                <span className="font-mono text-xs text-foreground-muted">{v.colorHex}</span>
              )}
              <button
                type="button"
                disabled={removingId === v.id}
                onClick={() => handleRemoveValue(v.id)}
                className="rounded p-1 text-danger/50 hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add value form */}
        <form onSubmit={handleAddValue} className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium text-foreground">Add Value</p>
          <div className="flex items-center gap-2">
            {isColor && (
              <>
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded border border-border p-0.5"
                />
                <Input
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  placeholder="#000000"
                  className="w-28 font-mono text-xs"
                />
              </>
            )}
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={isColor ? "Color name (e.g. Red)" : "Value"}
              className="flex-1"
              required
            />
            <Button type="submit" size="sm" variant="outline" isLoading={addingValue}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>
        </form>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/attributes")}>Back to Attributes</Button>
      </div>
    </div>
  );
}
