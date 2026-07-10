"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { BANNER_POSITIONS, createBanner, uploadBannerImage } from "../../../../lib/api/banners";

const schema = z.object({
  title: z.string().min(1, "Required"),
  linkUrl: z.string().optional(),
  position: z.string().min(1, "Required"),
  sortOrder: z.coerce.number().default(0),
});
type FormValues = z.infer<typeof schema>;

export default function NewBannerPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { sortOrder: 0 } });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  }

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!file) throw new Error("Select an image for the banner");
      const media = await uploadBannerImage(file);
      return createBanner({
        title: values.title,
        mediaId: media.id,
        position: values.position,
        linkUrl: values.linkUrl || undefined,
        sortOrder: values.sortOrder,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast({ title: "Banner created", variant: "success" });
      router.push("/banners");
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <PageHeader
        title="New Banner"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Banners", href: "/banners" }, { label: "New" }]}
      />
      <form
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="flex flex-col gap-4 rounded-xl border border-border bg-white p-6"
      >
        <FormField label="Image" htmlFor="image" required>
          {preview && <img src={preview} alt="Preview" className="mb-2 h-32 w-full rounded object-cover" />}
          <Input id="image" type="file" accept="image/*" onChange={handleFileChange} />
        </FormField>
        <FormField label="Title" htmlFor="title" error={errors.title?.message} required>
          <Input id="title" {...register("title")} />
        </FormField>
        <FormField label="Link URL" htmlFor="linkUrl">
          <Input id="linkUrl" placeholder="/c/some-category" {...register("linkUrl")} />
        </FormField>
        <FormField label="Position" htmlFor="position" error={errors.position?.message} required>
          <Select value={watch("position")} onValueChange={(v) => setValue("position", v)}>
            <SelectTrigger id="position">
              <SelectValue placeholder="Select a position" />
            </SelectTrigger>
            <SelectContent>
              {BANNER_POSITIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Sort Order" htmlFor="sortOrder">
          <Input id="sortOrder" type="number" {...register("sortOrder")} />
        </FormField>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Create Banner
          </Button>
        </div>
      </form>
    </div>
  );
}
