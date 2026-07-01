"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, Skeleton, StatusBadge } from "@mirakart/ui";
import { fetchReturns } from "../../../lib/api/returns";

export default function ReturnsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["returns"], queryFn: () => fetchReturns() });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!data || data.data.length === 0) {
    return <EmptyState title="No return requests" description="Returns you request will show up here." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-medium text-foreground">My Returns</h1>
      {data.data.map((ret) => (
        <Link
          key={ret.id}
          href={`/account/returns/${ret.id}`}
          className="flex items-center justify-between rounded-md border border-border p-4 transition-colors hover:border-primary"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{ret.returnNumber}</p>
            <p className="text-xs text-foreground-muted">{ret.reason.label}</p>
            <p className="text-xs text-foreground-muted">{new Date(ret.requestedAt).toLocaleDateString()}</p>
          </div>
          <StatusBadge status={ret.status} />
        </Link>
      ))}
    </div>
  );
}
