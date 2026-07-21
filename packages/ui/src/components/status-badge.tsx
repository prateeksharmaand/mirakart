import { Badge, type BadgeProps } from "./badge";

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  PENDING: "warning",
  PENDING_CONFIRMATION: "warning",
  CONFIRMED: "primary",
  ACCEPTED: "primary",
  PROCESSING: "primary",
  PACKED: "primary",
  SHIPPED: "primary",
  OUT_FOR_DELIVERY: "primary",
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
  AWAITING_SHIPMENT: "primary",
  ITEM_RECEIVED: "primary",
  COMPLETED: "success",
  UNPAID: "warning",
  PAID: "success",
  AUTHORIZED: "primary",
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
