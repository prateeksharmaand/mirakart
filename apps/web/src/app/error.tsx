"use client";

import * as React from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-gutter py-20 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl font-bold text-foreground-muted">Oops</span>
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="max-w-sm text-sm text-foreground-muted">
          We ran into an unexpected error. Please try refreshing the page or go back home.
        </p>
        {error.digest && (
          <p className="text-xs text-foreground-muted">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-background-light transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
