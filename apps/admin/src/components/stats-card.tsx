import * as React from "react";
import { Skeleton } from "@mirakart/ui";
import { cn } from "@mirakart/ui";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  isLoading?: boolean;
  subtitle?: string;
}

export function StatsCard({ title, value, icon: Icon, iconColor = "text-primary", isLoading, subtitle }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
          )}
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("rounded-lg bg-gray-50 p-3", iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
