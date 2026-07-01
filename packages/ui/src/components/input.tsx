import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-form w-full rounded-sm border bg-background px-3.5 text-base text-foreground placeholder:text-placeholder transition-colors duration-200 ease-theme",
        "border-border-form focus:border-border-form-active focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-danger focus:border-danger",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
