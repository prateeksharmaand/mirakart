"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AttributeFilter } from "../lib/api/catalog";

interface Props {
  attributes: AttributeFilter[];
}

export function AttributeFilterPanel({ attributes }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current selected attribute value IDs from ?av=id1,id2,...
  const selectedIds = React.useMemo(() => {
    const raw = searchParams.get("av");
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [searchParams]);

  function toggle(valueId: string) {
    const next = selectedIds.includes(valueId)
      ? selectedIds.filter((id) => id !== valueId)
      : [...selectedIds, valueId];

    const params = new URLSearchParams(searchParams.toString());
    if (next.length > 0) params.set("av", next.join(","));
    else params.delete("av");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  // Only show attributes that have values
  const visible = attributes.filter((a) => a.values.length > 0 && a.type !== "TEXT");
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((attr) => (
        <div key={attr.id} className="rounded-md border border-border p-4 flex flex-col gap-3">
          <span className="text-sm font-medium text-foreground">{attr.name}</span>

          {attr.type === "COLOR" ? (
            // Color swatches
            <div className="flex flex-wrap gap-2">
              {attr.values.map((val) => {
                const isSelected = selectedIds.includes(val.id);
                return (
                  <button
                    key={val.id}
                    type="button"
                    title={val.value}
                    onClick={() => toggle(val.id)}
                    className={`relative h-8 w-8 rounded-full border-2 transition-all ${
                      isSelected ? "border-primary scale-110" : "border-border hover:border-foreground"
                    }`}
                    style={{ backgroundColor: val.colorHex ?? "#ccc" }}
                  >
                    <span className="sr-only">{val.value}</span>
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 text-white drop-shadow-sm">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            // Size / SELECT chips
            <div className="flex flex-wrap gap-2">
              {attr.values.map((val) => {
                const isSelected = selectedIds.includes(val.id);
                return (
                  <button
                    key={val.id}
                    type="button"
                    onClick={() => toggle(val.id)}
                    className={`rounded border px-3 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-border text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {val.value}
                  </button>
                );
              })}
            </div>
          )}

          {/* Clear link */}
          {attr.values.some((v) => selectedIds.includes(v.id)) && (
            <button
              type="button"
              onClick={() => {
                const idsToRemove = new Set(attr.values.map((v) => v.id));
                const next = selectedIds.filter((id) => !idsToRemove.has(id));
                const params = new URLSearchParams(searchParams.toString());
                if (next.length > 0) params.set("av", next.join(","));
                else params.delete("av");
                params.delete("page");
                router.push(`?${params.toString()}`);
              }}
              className="text-xs text-primary hover:underline self-start"
            >
              Clear {attr.name}
            </button>
          )}
        </div>
      ))}
    </>
  );
}
