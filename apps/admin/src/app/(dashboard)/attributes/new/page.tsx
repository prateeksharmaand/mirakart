"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { createAttribute } from "../../../../lib/api/catalog";
import { Plus, X } from "lucide-react";

const schema = z.object({ name: z.string().min(1, "Required"), type: z.string().min(1, "Required") });
type FormValues = z.infer<typeof schema>;

export default function NewAttributePage() {
  const router = useRouter();
  const [values, setValues] = React.useState<string[]>([""]);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => createAttribute({ name: v.name, type: v.type, values: values.filter(Boolean) }),
    onSuccess: () => { toast({ title: "Attribute created", variant: "success" }); router.push("/attributes"); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  function addValue() { setValues((prev) => [...prev, ""]); }
  function removeValue(i: number) { setValues((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateValue(i: number, v: string) { setValues((prev) => prev.map((x, idx) => idx === i ? v : x)); }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader title="New Attribute" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Attributes", href: "/attributes" }, { label: "New" }]} />
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" placeholder="e.g. Color, Size" {...register("name")} />
        </FormField>
        <FormField label="Type" htmlFor="type" error={errors.type?.message} required>
          <Select onValueChange={(v) => setValue("type", v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SELECT">Select (dropdown)</SelectItem>
              <SelectItem value="COLOR">Color</SelectItem>
              <SelectItem value="TEXT">Text</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Values</p>
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
          <Button type="submit" isLoading={mutation.isPending}>Create</Button>
        </div>
      </form>
    </div>
  );
}
