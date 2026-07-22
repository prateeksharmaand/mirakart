export function generateProductCode(brandCode: string | null, sequence: number): string {
  const prefix = brandCode?.trim() || "PRD";
  return `${prefix}-${String(sequence).padStart(6, "0")}`;
}
