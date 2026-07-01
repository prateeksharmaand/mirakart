"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { dismissToast, useToasts } from "../hooks/use-toast";

export function Toaster() {
  const toasts = useToasts();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          open
          onOpenChange={(open) => {
            if (!open) dismissToast(t.id);
          }}
          className={cn(
            "flex items-start gap-3 rounded-md border bg-background p-4 shadow-modal",
            t.variant === "success" && "border-success",
            t.variant === "danger" && "border-danger",
            (!t.variant || t.variant === "default") && "border-border",
          )}
        >
          <div className="flex-1">
            <ToastPrimitive.Title className="text-sm font-medium text-foreground">{t.title}</ToastPrimitive.Title>
            {t.description ? (
              <ToastPrimitive.Description className="mt-1 text-xs text-foreground-muted">
                {t.description}
              </ToastPrimitive.Description>
            ) : null}
          </div>
          <ToastPrimitive.Close className="text-foreground-muted hover:text-foreground" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-6" />
    </ToastPrimitive.Provider>
  );
}
