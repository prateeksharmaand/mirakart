import * as React from "react";
import { Check } from "lucide-react";

const STEPS = [
  { id: "cart", label: "Shopping Cart" },
  { id: "checkout", label: "Checkout Details" },
  { id: "confirmation", label: "Order Complete" },
] as const;

export function CheckoutSteps({ current }: { current: (typeof STEPS)[number]["id"] }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="mb-8 flex items-center justify-center">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-foreground text-background"
                      : "bg-background-light text-foreground-muted"
                }`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={`hidden text-xs font-medium uppercase tracking-wide sm:inline ${
                  isActive || isCompleted ? "text-foreground" : "text-foreground-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span className={`mx-3 h-px w-8 shrink-0 sm:w-16 ${isCompleted ? "bg-foreground" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
