import { Badge, type BadgeProps } from "./badge";

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  PENDING: "warning",
  CONFIRMED: "primary",
  PROCESSING: "primary",
  SHIPPED: "primary",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "default",
  RETURNED: "default",
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
