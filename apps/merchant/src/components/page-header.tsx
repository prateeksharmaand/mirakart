import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb { label: string; href?: string; }

export function PageHeader({ title, crumbs, action }: { title: string; crumbs?: Crumb[]; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
            {crumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.href ? <Link href={crumb.href} className="hover:text-foreground">{crumb.label}</Link> : <span>{crumb.label}</span>}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
