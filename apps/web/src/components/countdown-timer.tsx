"use client";

import * as React from "react";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function getRemaining(endsAt: string): Remaining {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor(diff / (1000 * 60 * 60)) % 24,
    minutes: Math.floor(diff / (1000 * 60)) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    expired: false,
  };
}

export function CountdownTimer({ endsAt }: { endsAt: string }) {
  // Start null so SSR output and the client's first hydration pass match
  // exactly — the real (time-dependent) value is only computed after mount.
  const [remaining, setRemaining] = React.useState<Remaining | null>(null);

  React.useEffect(() => {
    setRemaining(getRemaining(endsAt));
    const timer = setInterval(() => setRemaining(getRemaining(endsAt)), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (remaining?.expired) {
    return <p className="text-xs font-medium text-danger">Deal ended</p>;
  }

  const units = remaining ? [remaining.days, remaining.hours, remaining.minutes, remaining.seconds] : null;

  return (
    <div className="flex items-center gap-1.5">
      {(units ?? [null, null, null, null]).map((value, i) => (
        <React.Fragment key={i}>
          <span className="flex h-9 w-9 items-center justify-center rounded bg-background-light text-sm font-semibold text-foreground">
            {value === null ? "--" : String(value).padStart(2, "0")}
          </span>
          {i < 3 && <span className="text-foreground-muted">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
