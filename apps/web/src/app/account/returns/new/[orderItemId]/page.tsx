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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
  toast,
} from "@mirakart/ui";
import { createReturn, fetchReturnReasons } from "../../../../../lib/api/returns";
import { uploadFile } from "../../../../../lib/api/uploads";

export default function NewReturnPage({ params }: { params: { orderItemId: string } }) {
  const router = useRouter();
  const { data: reasons, isLoading } = useQuery({ queryKey: ["return-reasons"], queryFn: fetchReturnReasons });
  const [reasonId, setReasonId] = React.useState("");
  const [reasonDetail, setReasonDetail] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [files, setFiles] = React.useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonId) {
      toast({ title: "Select a reason", variant: "danger" });
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
          <FormField label="Reason" required>
            <Select value={reasonId} onValueChange={setReasonId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons?.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    {reason.label}
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
