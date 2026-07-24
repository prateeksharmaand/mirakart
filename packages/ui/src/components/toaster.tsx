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
      {toasts.map((t) => {
        const variant = t.variant ?? "default";
        return (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={(open) => {
              if (!open) dismissToast(t.id);
            }}
            className={cn(
              "flex items-start gap-3 rounded-md p-4 shadow-modal",
              "data-[state=open]:animate-toast-in data-[state=closed]:animate-toast-out",
              "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
              variant === "success" && "bg-success text-white",
              variant === "danger" && "bg-danger text-white",
              variant === "default" && "bg-foreground text-background",
            )}
          >
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm leading-relaxed">{t.title}</ToastPrimitive.Title>
              {t.description ? (
                <ToastPrimitive.Description className="mt-1 text-xs opacity-80">
                  {t.description}
                </ToastPrimitive.Description>
              ) : null}
              {t.action ? (
                <a href={t.action.href} className="mt-1.5 inline-block text-sm font-medium underline underline-offset-2 hover:opacity-80">
                  {t.action.label}
                </a>
              ) : null}
            </div>
            <ToastPrimitive.Close className="opacity-80 hover:opacity-100" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-6" />
    </ToastPrimitive.Provider>
  );
}
