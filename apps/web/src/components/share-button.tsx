"use client";

import * as React from "react";
import { Share2 } from "lucide-react";
import { toast } from "@mirakart/ui";

interface ShareButtonProps {
  title: string;
  className?: string;
  /** "icon" (default) — round icon button. "text" — inline text link with icon. */
  variant?: "icon" | "text";
}

export function ShareButton({ title, className = "", variant = "icon" }: ShareButtonProps) {
  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const shareData = { title, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled the share sheet — no action needed
      }
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    toast({ title: "Link copied to clipboard", variant: "success" });
  }

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={`flex items-center gap-1.5 text-foreground-muted transition-colors hover:text-primary ${className}`}
      >
        <Share2 className="h-3.5 w-3.5" />
        Share this Product
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Share this product"
      onClick={handleShare}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-soft transition-colors hover:bg-primary hover:text-white ${className}`}
    >
      <Share2 className="h-3.5 w-3.5" />
    </button>
  );
}
