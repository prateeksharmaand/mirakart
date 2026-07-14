"use client";

import * as React from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { CategoryNode } from "../types/catalog";

// Node ids whose children panel should default to expanded — any ancestor
// of a selected/pinned node (so the active branch is visible on load).
function collectExpandIds(nodes: CategoryNode[], targets: Set<string>): Set<string> {
  const expand = new Set<string>();
  function walk(list: CategoryNode[]): boolean {
    let matched = false;
    for (const node of list) {
      const childMatched = node.children.length > 0 && walk(node.children);
      if (targets.has(node.id) || childMatched) {
        expand.add(node.id);
        matched = true;
      }
    }
    return matched;
  }
  walk(nodes);
  return expand;
}

interface CategoryTreeProps {
  nodes: CategoryNode[];
  selectedIds: Set<string>;
  /** Always shown checked — the current page's own category. */
  pinnedId?: string;
  onToggle: (id: string) => void;
  /** Called instead of onToggle when the pinned node is clicked (e.g. navigate to the unfiltered listing). */
  onTogglePinned?: () => void;
}

export function CategoryTree({ nodes, selectedIds, pinnedId, onToggle, onTogglePinned }: CategoryTreeProps) {
  const expandIds = React.useMemo(() => {
    const targets = new Set(selectedIds);
    if (pinnedId) targets.add(pinnedId);
    return collectExpandIds(nodes, targets);
  }, [nodes, selectedIds, pinnedId]);

  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map((node) => (
        <CategoryTreeRow
          key={node.id}
          node={node}
          selectedIds={selectedIds}
          pinnedId={pinnedId}
          onToggle={onToggle}
          onTogglePinned={onTogglePinned}
          expandIds={expandIds}
          depth={0}
        />
      ))}
    </div>
  );
}

function CategoryTreeRow({
  node,
  selectedIds,
  pinnedId,
  onToggle,
  onTogglePinned,
  expandIds,
  depth,
}: {
  node: CategoryNode;
  selectedIds: Set<string>;
  pinnedId?: string;
  onToggle: (id: string) => void;
  onTogglePinned?: () => void;
  expandIds: Set<string>;
  depth: number;
}) {
  const [manualOpen, setManualOpen] = React.useState<boolean | null>(null);
  const open = manualOpen ?? expandIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isPinned = node.id === pinnedId;
  const isSelected = isPinned || selectedIds.has(node.id);

  return (
    <div>
      <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 16}px` }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setManualOpen(!open)}
            aria-label={open ? "Collapse" : "Expand"}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-foreground-muted transition-colors hover:text-foreground"
          >
            {open ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          </button>
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}
        <button
          type="button"
          title={isPinned ? "Click to clear this category" : undefined}
          onClick={() => (isPinned ? onTogglePinned?.() : onToggle(node.id))}
          className="flex flex-1 items-center gap-2 rounded py-1.5 text-left text-sm"
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
              isSelected ? "border-primary bg-primary" : "border-border"
            }`}
          >
            {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
          </span>
          <span
            className={
              isSelected ? "font-medium text-primary" : "text-foreground-muted transition-colors hover:text-foreground"
            }
          >
            {node.name}
          </span>
        </button>
      </div>
      {hasChildren && open && (
        <div className="flex flex-col gap-0.5">
          {node.children.map((child) => (
            <CategoryTreeRow
              key={child.id}
              node={child}
              selectedIds={selectedIds}
              pinnedId={pinnedId}
              onToggle={onToggle}
              onTogglePinned={onTogglePinned}
              expandIds={expandIds}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
