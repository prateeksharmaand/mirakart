"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@mirakart/ui";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Set to make this column's header clickable — toggles sortBy/sortOrder via onSortChange. */
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (key: string) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  isLoading,
  emptyMessage = "No records found",
  sortBy,
  sortOrder,
  onSortChange,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50">
            {columns.map((col) => {
              const isSorted = sortBy === col.key;
              return (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col.className ?? ""}`}
                >
                  {col.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(col.key)}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {col.header}
                      {isSorted ? (
                        sortOrder === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3"><Skeleton className="h-4 w-full max-w-[200px]" /></td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">{emptyMessage}</td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={String(row[keyField])} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>{col.cell(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
