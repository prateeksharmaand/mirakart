"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { dismissToast, useToasts } from "../hooks/use-toast";

const VARIANT_ICON = {
  success: CheckCircle2,
  danger: XCircle,
  default: Info,
} as const;

export function Toaster() {
  const toasts = useToasts();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => {
        const variant = t.variant ?? "default";
        const Icon = VARIANT_ICON[variant];
        return (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={(open) => {
              if (!open) dismissToast(t.id);
            }}
            className={cn(
              "flex items-start gap-3 rounded-md border-l-4 bg-background p-4 shadow-modal",
              "data-[state=open]:animate-toast-in data-[state=closed]:animate-toast-out",
              "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
              variant === "success" && "border-success",
              variant === "danger" && "border-danger",
              variant === "default" && "border-info",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                variant === "success" && "bg-success/10 text-success",
                variant === "danger" && "bg-danger/10 text-danger",
                variant === "default" && "bg-info/10 text-foreground-muted",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1 pt-0.5">
              <ToastPrimitive.Title className="text-sm font-medium text-foreground">{t.title}</ToastPrimitive.Title>
              {t.description ? (
                <ToastPrimitive.Description className="mt-1 text-xs text-foreground-muted">
                  {t.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close className="mt-0.5 text-foreground-muted hover:text-foreground" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-6" />
    </ToastPrimitive.Provider>
  );
}
