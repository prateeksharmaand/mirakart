const UNIT_MS = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

/** Parses short duration strings like "15m", "30d", "12h" into milliseconds. */
export function parseDurationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration string: "${value}" (expected e.g. "15m", "30d")`);
  }
  // Both groups are guaranteed present by the regex match above.
  const amount = match[1]!;
  const unit = match[2] as keyof typeof UNIT_MS;
  return Number(amount) * UNIT_MS[unit];
}
