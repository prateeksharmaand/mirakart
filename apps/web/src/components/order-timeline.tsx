import { Check } from "lucide-react";
import type { OrderStatus } from "../types/order";

const HAPPY_PATH_STEPS: { status: OrderStatus; label: string; description: string }[] = [
  {
    status: "PENDING_CONFIRMATION",
    label: "Pending Confirmation",
    description: "We've received your order and it's waiting to be confirmed.",
  },
  {
    status: "CONFIRMED",
    label: "Confirmed",
    description: "Your order is confirmed and has been sent to the seller.",
  },
  {
    status: "ACCEPTED",
    label: "Accepted",
    description: "The seller has accepted your order and will start preparing it.",
  },
  {
    status: "PROCESSING",
    label: "Processing",
    description: "Your items are being picked and prepared for packing.",
  },
  {
    status: "PACKED",
    label: "Packed",
    description: "Your order has been packed and is ready to be shipped.",
  },
  {
    status: "READY_TO_SHIP",
    label: "Ready to Ship",
    description: "Your package is ready and waiting for pickup by the courier.",
  },
  {
    status: "SHIPPED",
    label: "Shipped",
    description: "Your order has been handed to the courier and is on its way.",
  },
  {
    status: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    description: "Your package is with the delivery agent and will arrive soon.",
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    description: "Your order has been delivered successfully.",
  },
  {
    status: "COMPLETED",
    label: "Completed",
    description: "This order is complete. Thanks for shopping with us!",
  },
];

const TERMINAL_INFO: Partial<Record<OrderStatus, { label: string; description: string }>> = {
  CANCELLED: { label: "Order Cancelled", description: "This order has been cancelled." },
  FAILED_DELIVERY: { label: "Delivery Failed", description: "Delivery could not be completed for this order." },
  COD_REFUSED: { label: "Delivery Refused", description: "The Cash on Delivery payment was refused at delivery." },
};

interface OrderTimelineProps {
  status: OrderStatus;
  history?: { status: string; changedAt: string }[];
}

/** Vertical order-status stepper — generalizes CheckoutSteps' circle/line
 * pattern for the longer post-purchase COD ladder. Terminal/exception
 * statuses render a banner instead of forcing them onto the linear steps. */
export function OrderTimeline({ status, history = [] }: OrderTimelineProps) {
  const terminal = TERMINAL_INFO[status];
  if (terminal) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger/5 p-4">
        <p className="text-sm font-medium text-danger">{terminal.label}</p>
        <p className="mt-1 text-xs text-foreground-muted">{terminal.description}</p>
      </div>
    );
  }

  const currentIndex = HAPPY_PATH_STEPS.findIndex((s) => s.status === status);
  const timestampByStatus = new Map(history.map((h) => [h.status, h.changedAt]));

  return (
    <div className="flex flex-col">
      {HAPPY_PATH_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isLast = index === HAPPY_PATH_STEPS.length - 1;
        const timestamp = timestampByStatus.get(step.status);
        return (
          <div key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-foreground text-background"
                      : "bg-background-light text-foreground-muted"
                }`}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              {!isLast && (
                <span className={`w-px flex-1 ${isCompleted ? "bg-foreground" : "bg-border"}`} style={{ minHeight: "1.5rem" }} />
              )}
            </div>
            <div className={isLast ? "pb-0" : "pb-5"}>
              <p className={`text-sm font-medium ${isActive || isCompleted ? "text-foreground" : "text-foreground-muted"}`}>
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-foreground-muted">{step.description}</p>
              {timestamp && <p className="mt-0.5 text-xs text-foreground-muted">{new Date(timestamp).toLocaleString()}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
