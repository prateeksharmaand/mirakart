"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge, Button, FormField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { listMyDocuments, uploadDocument, type MerchantDocument } from "../../../lib/api/profile";
import { CheckCircle, Clock, XCircle, FileText } from "lucide-react";

const schema = z.object({
  type: z.string().min(1, "Required"),
  mediaId: z.string().min(1, "A document media ID is required (upload via API first)"),
});
type FormValues = z.infer<typeof schema>;

const DOC_TYPES = [
  { value: "PAN", label: "PAN Card" },
  { value: "GST", label: "GST Certificate" },
  { value: "BUSINESS_REG", label: "Business Registration" },
  { value: "BANK_STATEMENT", label: "Bank Statement" },
  { value: "ADDRESS_PROOF", label: "Address Proof" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "APPROVED") return <CheckCircle className="h-4 w-4 text-success" />;
  if (status === "REJECTED") return <XCircle className="h-4 w-4 text-danger" />;
  return <Clock className="h-4 w-4 text-warning" />;
}

export default function MerchantDocumentsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = React.useState(false);

  const { data: docs, isLoading } = useQuery({ queryKey: ["merchant-documents"], queryFn: listMyDocuments });

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchant-documents"] });
      toast({ title: "Document submitted", variant: "success" });
      reset();
      setShowForm(false);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title="Verification Documents"
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Documents" }]}
        action={<Button onClick={() => setShowForm((v) => !v)}>Add Document</Button>}
      />

      <p className="text-sm text-muted-foreground">
        Submit verification documents to get your store approved and increase customer trust.
      </p>

      {showForm && (
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="rounded-xl border border-primary/30 bg-primary/5 p-6 flex flex-col gap-4"
        >
          <h2 className="text-sm font-semibold">Submit New Document</h2>
          <FormField label="Document Type" error={errors.type?.message} required>
            <Select onValueChange={(v) => setValue("type", v)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Media ID" htmlFor="mediaId" error={errors.mediaId?.message} hint="Upload file first via /uploads, then paste the media ID here" required>
            <input id="mediaId" {...register("mediaId")} className="flex h-[42px] w-full rounded border border-border-form bg-white px-3 text-sm focus:border-border-form-active focus:outline-none" />
          </FormField>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>Submit</Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !docs || docs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
          <FileText className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">No documents submitted yet</p>
          <p className="text-xs mt-1">Click "Add Document" to submit your first verification document.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white divide-y divide-border">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <StatusIcon status={doc.status} />
                <div>
                  <p className="text-sm font-medium">{DOC_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}</p>
                  {doc.rejectionReason && <p className="text-xs text-danger mt-0.5">{doc.rejectionReason}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {doc.media?.url && (
                  <a href={doc.media.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View</a>
                )}
                <Badge variant={doc.status === "APPROVED" ? "success" : doc.status === "REJECTED" ? "danger" : "warning"}>
                  {doc.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
