"use client";

import * as React from "react";

interface Section {
  id: string;
  label: string;
}

/** Sticky quick-jump nav for long forms — click to scroll to a section, active section highlights as you scroll. */
export function SectionNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = React.useState(sections[0]?.id);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-0 z-10 -mx-6 flex gap-1 overflow-x-auto border-b border-border bg-white/95 px-6 py-2 backdrop-blur">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => scrollTo(s.id)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            active === s.id ? "bg-primary text-white" : "text-foreground-muted hover:bg-background-light"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
