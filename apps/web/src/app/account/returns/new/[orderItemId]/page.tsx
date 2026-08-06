"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
  toast,
} from "@mirakart/ui";
import { createReturn, fetchReplacementOptions, fetchReturnReasons } from "../../../../../lib/api/returns";
import { uploadFile } from "../../../../../lib/api/uploads";
import type { ReplacementOption, ReturnResolutionType, VariantAttributeValue } from "../../../../../types/return";

function variantAttributeMap(variant: { attributeValues: VariantAttributeValue[] }): Record<string, string> {
  const map: Record<string, string> = {};
  for (const link of variant.attributeValues) {
    map[link.attributeValue.attribute.id] = link.attributeValue.id;
  }
  return map;
}

function ReplacementPicker({
  options,
  onSelect,
}: {
  options: ReplacementOption[];
  onSelect: (variantId: string | undefined) => void;
}) {
  const attributes = React.useMemo(() => {
    const byId = new Map<
      string,
      { id: string; name: string; type: string; values: Map<string, { id: string; value: string; colorHex: string | null }> }
    >();
    for (const variant of options) {
      for (const link of variant.attributeValues) {
        const attr = link.attributeValue.attribute;
        if (!byId.has(attr.id)) byId.set(attr.id, { id: attr.id, name: attr.name, type: attr.type, values: new Map() });
        byId.get(attr.id)!.values.set(link.attributeValue.id, {
          id: link.attributeValue.id,
          value: link.attributeValue.value,
          colorHex: link.attributeValue.colorHex,
        });
      }
    }
    return [...byId.values()];
  }, [options]);

  const [selected, setSelected] = React.useState<Record<string, string>>(() => {
    const first = options[0];
    return first ? variantAttributeMap(first) : {};
  });

  const matched = React.useMemo(
    () => options.find((v) => attributes.every((attr) => variantAttributeMap(v)[attr.id] === selected[attr.id])),
    [attributes, options, selected],
  );

  React.useEffect(() => {
    onSelect(matched?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched?.id]);

  if (attributes.length === 0) {
    // Only one variant on this product — nothing to pick, it's just "send another one".
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {attributes.map((attribute) => (
        <FormField key={attribute.id} label={attribute.name}>
          <div className="flex flex-wrap gap-2">
            {[...attribute.values.values()].map((value) => {
              const isSelected = selected[attribute.id] === value.id;
              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() => setSelected((s) => ({ ...s, [attribute.id]: value.id }))}
                  className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                    isSelected ? "border-primary bg-primary/5 text-primary" : "border-border-form text-foreground hover:border-primary"
                  }`}
                >
                  {value.value}
                </button>
              );
            })}
          </div>
        </FormField>
      ))}
      {matched && matched.inventory && matched.inventory.quantity === 0 ? (
        <p className="text-xs text-danger">This option is currently out of stock.</p>
      ) : null}
    </div>
  );
}

export default function NewReturnPage({ params }: { params: { orderItemId: string } }) {
  const router = useRouter();
  const { data: reasons, isLoading } = useQuery({ queryKey: ["return-reasons"], queryFn: fetchReturnReasons });
  const [reasonId, setReasonId] = React.useState("");
  const [reasonDetail, setReasonDetail] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [files, setFiles] = React.useState<File[]>([]);
  const [resolutionType, setResolutionType] = React.useState<ReturnResolutionType>("REFUND");
  const [replacementVariantId, setReplacementVariantId] = React.useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { data: replacementOptions, isLoading: loadingOptions } = useQuery({
    queryKey: ["replacement-options", params.orderItemId],
    queryFn: () => fetchReplacementOptions(params.orderItemId),
    enabled: resolutionType === "REPLACEMENT",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonId) {
      toast({ title: "Select a reason", variant: "danger" });
      return;
    }
    if (resolutionType === "REPLACEMENT" && !replacementVariantId) {
      toast({ title: "Select what you'd like instead", variant: "danger" });
      return;
    }
    setIsSubmitting(true);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadFile(file, "RETURN_IMAGES")));
      const ret = await createReturn({
        orderItemId: params.orderItemId,
        reasonId,
        reasonDetail: reasonDetail || undefined,
        quantity,
        imageMediaIds: uploaded.map((media) => media.id),
        resolutionType,
        replacementVariantId: resolutionType === "REPLACEMENT" ? replacementVariantId : undefined,
      });
      toast({ title: "Return requested", variant: "success" });
      router.push(`/account/returns/${ret.id}`);
    } catch (error) {
      toast({ title: "Couldn't submit return", description: (error as Error).message, variant: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Request a Return</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="What would you like?" required>
            <RadioGroup
              value={resolutionType}
              onValueChange={(v) => {
                setResolutionType(v as ReturnResolutionType);
                setReplacementVariantId(undefined);
              }}
              className="flex flex-col gap-2"
            >
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="REFUND" />
                Refund
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="REPLACEMENT" />
                Replace with a different item
              </label>
            </RadioGroup>
          </FormField>

          {resolutionType === "REPLACEMENT" ? (
            loadingOptions ? (
              <Skeleton className="h-20 w-full" />
            ) : replacementOptions && replacementOptions.length > 0 ? (
              <ReplacementPicker options={replacementOptions} onSelect={setReplacementVariantId} />
            ) : (
              <p className="text-xs text-foreground-muted">No other options available for this product.</p>
            )
          ) : null}

          <FormField label="Reason" required>
            <Select value={reasonId} onValueChange={setReasonId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons?.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    {reason.reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Additional details">
            <Textarea value={reasonDetail} onChange={(e) => setReasonDetail(e.target.value)} rows={4} />
          </FormField>
          <FormField label="Quantity" required>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
          </FormField>
          <FormField label="Photos (optional)">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="text-sm"
            />
          </FormField>
          <Button type="submit" isLoading={isSubmitting}>
            Submit request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
