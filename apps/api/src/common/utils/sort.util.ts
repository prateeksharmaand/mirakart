/**
 * Builds a Prisma `orderBy` object from a client-supplied sortBy/sortOrder
 * pair, restricted to an allowlist of sortable fields (never pass the raw
 * client string straight to Prisma — it'd let a client sort by arbitrary
 * relation/internal fields). Falls back to `defaultField` if the requested
 * field isn't allowed.
 */
export function buildOrderBy<T extends string>(
  sortBy: string | undefined,
  sortOrder: "asc" | "desc" | undefined,
  allowedFields: readonly T[],
  defaultField: T,
): Record<string, "asc" | "desc"> {
  const field = sortBy && (allowedFields as readonly string[]).includes(sortBy) ? sortBy : defaultField;
  return { [field]: sortOrder ?? "desc" };
}
