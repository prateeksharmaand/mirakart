import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { PaymentsRepository } from "./payments.repository";

/**
 * Idempotency service for payment operations
 * Prevents double-charging by tracking idempotency keys
 *
 * Usage:
 * 1. Generate key at client: const idempotencyKey = generateIdempotencyKey()
 * 2. Pass with payment request: await paymentService.initiate(orderId, { idempotencyKey })
 * 3. Service checks: existing payment with same key? return cached result
 * 4. If not: create new payment, store key, return result
 * 5. On retry with same key: return cached payment (not double-charged)
 */

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly paymentRepo: PaymentsRepository) {}

  /**
   * Generate a unique idempotency key (UUID v4)
   * Call this once on the client and reuse for retries
   */
  static generateKey(): string {
    return uuidv4();
  }

  /**
   * Check if a payment with this idempotency key already exists
   * If yes, return the existing payment (cached result)
   * If no, return null (proceed with new payment)
   */
  async getByIdempotencyKey(idempotencyKey: string) {
    if (!idempotencyKey) return null;

    const existing = await this.paymentRepo.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      this.logger.debug(`Payment exists for idempotency key ${idempotencyKey}: ${existing.id}`);
      return existing;
    }
    return null;
  }

  /**
   * Mark a payment as idempotent (it was recovered from cache)
   */
  async markAsIdempotent(paymentId: string) {
    return this.paymentRepo.updateIdempotencyMetadata(paymentId, {
      wasIdempotent: true,
      attemptCount: { increment: 1 },
    });
  }

  /**
   * Increment attempt count for a payment
   */
  async incrementAttempt(paymentId: string) {
    return this.paymentRepo.updateIdempotencyMetadata(paymentId, {
      attemptCount: { increment: 1 },
    });
  }
}
