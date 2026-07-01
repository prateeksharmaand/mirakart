import * as React from "react";
import { cn } from "../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded-sm border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-placeholder transition-colors duration-200 ease-theme",
        "border-border-form focus:border-border-form-active focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-danger focus:border-danger",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
