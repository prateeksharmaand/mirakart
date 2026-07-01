"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getReturn, updateReturnStatus } from "../../../../lib/api/returns";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  APPROVED: "success", PENDING: "warning", REJECTED: "danger", REFUNDED: "success",
};

export default function ReturnDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = React.useState("");
  const [note, setNote] = React.useState("");

  const { data: ret, isLoading } = useQuery({ queryKey: ["return", params.id], queryFn: () => getReturn(params.id) });
  React.useEffect(() => { if (ret) setNewStatus(ret.status); }, [ret]);

  const mutation = useMutation({
    mutationFn: () => updateReturnStatus(params.id, newStatus, note || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["return", params.id] }); toast({ title: "Status updated", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!ret) return <p>Return not found.</p>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={`Return — Order #${ret.order?.orderNumber ?? "—"}`}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Returns", href: "/returns" }, { label: `#${ret.order?.orderNumber ?? params.id}` }]}
      />

      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={STATUS_VARIANT[ret.status] ?? "default"}>{ret.status}</Badge></div>
        <div><p className="text-xs text-muted-foreground">Merchant</p><p className="text-sm">{ret.merchant?.storeName ?? "—"}</p></div>
        {ret.customer && <div><p className="text-xs text-muted-foreground">Customer</p><p className="text-sm">{ret.customer.firstName} {ret.customer.lastName}</p></div>}
        <div><p className="text-xs text-muted-foreground">Reason</p><p className="text-sm">{ret.reason?.name ?? "—"}</p></div>
        {ret.description && <div className="col-span-2"><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{ret.description}</p></div>}
        <div><p className="text-xs text-muted-foreground">Date</p><p className="text-sm">{new Date(ret.createdAt).toLocaleDateString()}</p></div>
      </div>

      {ret.images && ret.images.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold">Images</h2>
          <div className="flex gap-2 flex-wrap">
            {ret.images.map((img) => (
              <a key={img.id} href={img.media.url} target="_blank" rel="noreferrer">
                <img src={img.media.url} alt="Return" className="h-24 w-24 rounded object-cover border border-border hover:opacity-80" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold">Update Status</h2>
        <div className="flex flex-col gap-3">
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div>
            <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending} disabled={newStatus === ret.status}>
              Update Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
