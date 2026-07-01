import { randomInt } from "crypto";

export function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = randomInt(1000, 9999);
  return `ORD-${datePart}-${randomPart}`;
}
