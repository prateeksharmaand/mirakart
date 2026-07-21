"use client";

import * as React from "react";
import Link from "next/link";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = React.useState(tabs[0]?.id ?? "");

  return (
    <div>
      {/* Tab nav */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                active === tab.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="py-6">
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
}

export function TagList({ tags }: { tags: Array<{ tag: { id: string; name: string; slug: string } }> }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ tag }) => (
        <Link
          key={tag.id}
          href={`/products?tag=${tag.slug}`}
          className="rounded-full border border-border px-3 py-1 text-xs capitalize text-foreground-muted hover:border-foreground hover:text-foreground transition-colors"
        >
          #{tag.name}
        </Link>
      ))}
    </div>
  );
}
