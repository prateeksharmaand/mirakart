"use client";

import * as React from "react";

/** Keeps form Save/Cancel actions visible at the bottom of the scroll area on long forms. */
export function StickyActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-6 flex gap-3 border-t border-border bg-white px-6 py-4">
      {children}
    </div>
  );
}
