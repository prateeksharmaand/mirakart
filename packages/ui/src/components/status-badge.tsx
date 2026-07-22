import { Badge, type BadgeProps } from "./badge";

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  PENDING: "warning",
  PENDING_CONFIRMATION: "warning",
  // In-progress/neutral states use "info" rather than "primary" — primary is
  // the brand red, which read as an error/warning next to CANCELLED/danger.
  CONFIRMED: "info",
  ACCEPTED: "info",
  PROCESSING: "info",
  PACKED: "info",
  SHIPPED: "info",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "default",
  RETURNED: "default",
  FAILED_DELIVERY: "danger",
  COD_REFUSED: "danger",
  APPROVED: "success",
  REJECTED: "danger",
  DRAFT: "default",
  PENDING_APPROVAL: "warning",
  ARCHIVED: "default",
  ACTIVE: "success",
  INACTIVE: "default",
  SUSPENDED: "danger",
  BLOCKED: "danger",
  REQUESTED: "warning",
  UNDER_REVIEW: "warning",
  AWAITING_SHIPMENT: "info",
  ITEM_RECEIVED: "info",
  COMPLETED: "success",
  UNPAID: "warning",
  PAID: "success",
  AUTHORIZED: "info",
  CAPTURED: "success",
  FAILED: "danger",
};

function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANT[status] ?? "default"}>{formatStatusLabel(status)}</Badge>;
}
