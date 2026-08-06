"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge, Skeleton } from "@mirakart/ui";
import { PageHeader } from "../../../../components/page-header";
import { getReturn, type ReturnStatus } from "../../../../lib/api/returns";

const STATUS_VARIANT: Record<ReturnStatus, "success" | "warning" | "danger" | "default"> = {
  REQUESTED: "warning",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  AWAITING_SHIPMENT: "default",
  ITEM_RECEIVED: "default",
  COMPLETED: "success",
  CANCELLED: "danger",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function ReturnDetailPage({ params }: { params: { id: string } }) {
  const { data: ret, isLoading } = useQuery({ queryKey: ["return", params.id], queryFn: () => getReturn(params.id) });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!ret) return <p>Return not found.</p>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        title={`Return — Order #${ret.order?.orderNumber ?? "—"}`}
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Returns", href: "/returns" }, { label: `#${ret.order?.orderNumber ?? params.id}` }]}
      />

      <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={STATUS_VARIANT[ret.status] ?? "default"}>{ret.status.replaceAll("_", " ")}</Badge></div>
        <div>
          <p className="text-xs text-muted-foreground">Requested</p>
          <Badge variant="default">{ret.resolutionType === "REPLACEMENT" ? "Replacement" : "Refund"}</Badge>
        </div>
        <div><p className="text-xs text-muted-foreground">Merchant</p><p className="text-sm">{ret.merchant?.storeName ?? "—"}</p></div>
        {ret.customer && <div><p className="text-xs text-muted-foreground">Customer</p><p className="text-sm">{ret.customer.firstName} {ret.customer.lastName}</p></div>}
        <div><p className="text-xs text-muted-foreground">Reason</p><p className="text-sm">{ret.reason?.reason ?? "—"}</p></div>
        <div><p className="text-xs text-muted-foreground">Quantity</p><p className="text-sm">{ret.quantity}</p></div>
        {ret.refundAmount != null && <div><p className="text-xs text-muted-foreground">Refund Amount</p><p className="text-sm">{formatCurrency(Number(ret.refundAmount))}</p></div>}
        {ret.reasonDetail && <div className="col-span-2"><p className="text-xs text-muted-foreground">Details</p><p className="text-sm">{ret.reasonDetail}</p></div>}
        <div><p className="text-xs text-muted-foreground">Date</p><p className="text-sm">{new Date(ret.createdAt).toLocaleDateString()}</p></div>
      </div>

      {ret.resolutionType === "REPLACEMENT" && (
        <div className="rounded-xl border border-border bg-white p-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Customer bought</p>
            <p className="text-sm">
              {ret.orderItem?.variantSnapshot.attributes.map((a) => `${a.attributeName}: ${a.value}`).join(", ") ||
                ret.orderItem?.variantSnapshot.sku}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Wants instead</p>
            <p className="text-sm">
              {ret.replacementVariant
                ? ret.replacementVariant.attributeValues
                    .map((a) => `${a.attributeValue.attribute.name}: ${a.attributeValue.value}`)
                    .join(", ") || ret.replacementVariant.sku
                : "—"}
            </p>
          </div>
        </div>
      )}

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
    </div>
  );
}
