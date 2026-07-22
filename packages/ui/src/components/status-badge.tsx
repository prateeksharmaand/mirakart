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
  READY_TO_SHIP: "info",
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

/** Product status badges read "Active" instead of "Approved" — the DB enum
 *  value stays APPROVED (shared with merchant/return "Approved" states,
 *  where that word is still correct) to avoid an enum rename. */
export const PRODUCT_STATUS_LABELS: Record<string, string> = { APPROVED: "Active" };

function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}

export function StatusBadge({
  status,
  labelOverrides,
}: {
  status: string;
  /** Per-context label overrides — e.g. a product's APPROVED status reads as
   *  "Active" without renaming the shared enum value used by merchants/
   *  returns/etc, where "Approved" is still the correct word. */
  labelOverrides?: Record<string, string>;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "default"}>{labelOverrides?.[status] ?? formatStatusLabel(status)}</Badge>
  );
}
