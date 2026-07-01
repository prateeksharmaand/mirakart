"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Skeleton, StatusBadge, toast } from "@mirakart/ui";
import { cancelReturn, fetchReturn } from "../../../../lib/api/returns";

const CANCELLABLE_STATUSES = ["REQUESTED", "UNDER_REVIEW"];

export default function ReturnDetailPage({ params }: { params: { returnId: string } }) {
  const queryClient = useQueryClient();
  const { data: ret, isLoading } = useQuery({
    queryKey: ["return", params.returnId],
    queryFn: () => fetchReturn(params.returnId),
  });

  async function handleCancel() {
    try {
      await cancelReturn(params.returnId);
      queryClient.invalidateQueries({ queryKey: ["return", params.returnId] });
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      toast({ title: "Return cancelled", variant: "success" });
    } catch (error) {
      toast({ title: "Couldn't cancel return", description: (error as Error).message, variant: "danger" });
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!ret) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-foreground">{ret.returnNumber}</h1>
          <p className="text-sm text-foreground-muted">{new Date(ret.requestedAt).toLocaleString()}</p>
        </div>
        <StatusBadge status={ret.status} />
      </div>

      <div className="rounded-md border border-border p-5">
        <p className="text-sm text-foreground">
          <span className="font-medium">Reason:</span> {ret.reason.label}
        </p>
        {ret.reasonDetail ? <p className="mt-1 text-sm text-foreground-muted">{ret.reasonDetail}</p> : null}
        <p className="mt-1 text-sm text-foreground-muted">Quantity: {ret.quantity}</p>
        {ret.refundAmount ? (
          <p className="mt-1 text-sm text-foreground-muted">Refund amount: ₹{ret.refundAmount}</p>
        ) : null}
      </div>

      {ret.images.length > 0 ? (
        <div className="flex gap-3">
          {ret.images.map((image) => (
            <img key={image.id} src={image.media.url} alt="" className="h-20 w-20 rounded-sm object-cover" />
          ))}
        </div>
      ) : null}

      {ret.statusHistory && ret.statusHistory.length > 0 ? (
        <div className="rounded-md border border-border p-5">
          <h2 className="mb-4 text-sm font-medium text-foreground">History</h2>
          <ol className="flex flex-col gap-3">
            {ret.statusHistory.map((entry) => (
              <li key={entry.id} className="text-sm">
                <span className="font-medium text-foreground">{entry.status}</span>{" "}
                <span className="text-foreground-muted">{new Date(entry.changedAt).toLocaleString()}</span>
                {entry.note ? <p className="text-xs text-foreground-muted">{entry.note}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {CANCELLABLE_STATUSES.includes(ret.status) ? (
        <Button variant="outline" className="w-fit" onClick={handleCancel}>
          Cancel request
        </Button>
      ) : null}
    </div>
  );
}
