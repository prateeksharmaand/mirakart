import { randomBytes, createHash } from "crypto";

/**
 * Refresh/reset tokens are opaque random secrets handed to the client.
 * Only their SHA-256 digest is persisted, so a database leak doesn't yield
 * directly usable tokens (mirrors how API key / PAT systems store secrets).
 */
export function generateOpaqueToken(): string {
  return randomBytes(48).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
