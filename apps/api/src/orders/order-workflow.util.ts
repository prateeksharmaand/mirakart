import type { OrderItemStatus, OrderStatus } from "@prisma/client";

export type CancelActor = "CUSTOMER" | "MERCHANT" | "ADMIN";

/**
 * The linear COD happy-path ladder. Terminal/exception states (CANCELLED,
 * REFUNDED, FAILED_DELIVERY, COD_REFUSED) and the online-payment-only
 * `PENDING` start state are intentionally excluded — they're reached via
 * dedicated side-transitions (cancel/reject/refuse), never by "advancing".
 */
export const ORDER_STATUS_RANK: OrderStatus[] = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "ACCEPTED",
  "PROCESSING",
  "PACKED",
  "READY_TO_SHIP",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
];

/** Mirrors ORDER_STATUS_RANK at the per-item level (used for the multi-merchant gating rule). */
export const ORDER_ITEM_STATUS_RANK: OrderItemStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ACCEPTED",
  "PROCESSING",
  "PACKED",
  "READY_TO_SHIP",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
];

const TERMINAL_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "CANCELLED",
  "REFUNDED",
  "FAILED_DELIVERY",
  "COD_REFUSED",
  "COMPLETED",
]);

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.has(status);
}

/** True only for a single forward step along the ladder — no skipping, no going backward. */
export function canAdvance(from: OrderStatus, to: OrderStatus): boolean {
  const fromIndex = ORDER_STATUS_RANK.indexOf(from);
  const toIndex = ORDER_STATUS_RANK.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return false;
  return toIndex === fromIndex + 1;
}

export const ITEM_TERMINAL_STATUSES: ReadonlySet<OrderItemStatus> = new Set([
  "CANCELLED",
  "RETURNED",
  "FAILED_DELIVERY",
  "COD_REFUSED",
]);

export function isTerminalItemStatus(status: OrderItemStatus): boolean {
  return ITEM_TERMINAL_STATUSES.has(status);
}

export function canAdvanceItem(from: OrderItemStatus, to: OrderItemStatus): boolean {
  const fromIndex = ORDER_ITEM_STATUS_RANK.indexOf(from);
  const toIndex = ORDER_ITEM_STATUS_RANK.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return false;
  return toIndex === fromIndex + 1;
}

/**
 * Cancellation cutoffs per actor, per spec: customer only before Processing,
 * merchant only before Shipped, admin anytime up to (but not including) a
 * terminal state.
 */
export function canCancel(status: OrderStatus, actor: CancelActor): boolean {
  if (isTerminalOrderStatus(status)) return false;
  if (actor === "ADMIN") return true;

  const rank = ORDER_STATUS_RANK.indexOf(status);
  if (rank === -1) return false; // e.g. PENDING (non-COD) — not part of this workflow

  const processingRank = ORDER_STATUS_RANK.indexOf("PROCESSING");
  const shippedRank = ORDER_STATUS_RANK.indexOf("SHIPPED");
  if (actor === "CUSTOMER") return rank < processingRank;
  if (actor === "MERCHANT") return rank < shippedRank;
  return false;
}

/**
 * "Gate on slowest merchant": given every active (non-cancelled/returned)
 * item's status across every merchant on the order, returns the OrderStatus
 * the order should reflect — the rank-minimum among those items, i.e. the
 * order only advances once every merchant has caught up. Returns null when
 * there's nothing meaningful to derive (e.g. all items are terminal).
 */
export function nextGatedOrderStatus(itemStatuses: OrderItemStatus[]): OrderStatus | null {
  const activeRanks = itemStatuses
    .filter((s) => !ITEM_TERMINAL_STATUSES.has(s))
    .map((s) => ORDER_ITEM_STATUS_RANK.indexOf(s))
    .filter((rank) => rank !== -1);
  if (activeRanks.length === 0) return null;
  const minRank = Math.min(...activeRanks);
  return ORDER_STATUS_RANK[minRank] ?? null;
}
