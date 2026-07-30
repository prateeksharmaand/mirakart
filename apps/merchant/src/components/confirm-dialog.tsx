"use client";

import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@mirakart/ui";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, description, confirmLabel = "Confirm", variant = "primary",
  isLoading, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const Icon = variant === "danger" ? AlertTriangle : HelpCircle;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center gap-3 pt-1 text-center">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              variant === "danger" ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
            }`}
          >
            <Icon className="h-6 w-6" />
          </span>
          <DialogHeader className="mb-0 items-center gap-1.5">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="mt-6 sm:justify-center">
          <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">Cancel</Button>
          <Button variant={variant} onClick={onConfirm} isLoading={isLoading} className="flex-1">{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
