"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@mirakart/ui";
import { Button } from "@mirakart/ui";

interface Action {
  label: string;
  icon?: React.ElementType;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "danger";
}

interface TableActionsProps {
  viewHref?: string;
  editHref?: string;
  onDelete?: () => void;
  extra?: Action[];
}

export function TableActions({ viewHref, editHref, onDelete, extra = [] }: TableActionsProps) {
  const actions: Action[] = [
    ...(viewHref ? [{ label: "View", icon: Eye, href: viewHref }] : []),
    ...(editHref ? [{ label: "Edit", icon: Pencil, href: editHref }] : []),
    ...extra,
    ...(onDelete ? [{ label: "Delete", icon: Trash2, onClick: onDelete, variant: "danger" as const }] : []),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) =>
          action.href ? (
            <DropdownMenuItem key={action.label} asChild>
              <Link href={action.href} className="flex items-center gap-2">
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={action.label}
              onClick={action.onClick}
              className={action.variant === "danger" ? "text-danger focus:text-danger" : ""}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
