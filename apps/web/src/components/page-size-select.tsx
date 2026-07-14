"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from "../lib/pagination";

export function PageSizeSelect({ currentLimit }: { currentLimit?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (Number(e.target.value) === DEFAULT_PAGE_SIZE) params.delete("limit");
    else params.set("limit", e.target.value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="hidden shrink-0 text-sm text-foreground-muted sm:block">Show</label>
      <select
        value={currentLimit ?? DEFAULT_PAGE_SIZE}
        onChange={handleChange}
        className="rounded border border-border bg-background py-1.5 pl-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size} Items
          </option>
        ))}
      </select>
    </div>
  );
}
