import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";

/**
 * Cart locking service to prevent concurrent modification race conditions
 * Uses Redis SET NX (compare-and-swap) for distributed locking
 * Prevents lost updates when two requests modify cart simultaneously
 *
 * Usage:
 * const lock = await cartLockService.acquireLock(cartId, 5000); // 5s timeout
 * try {
 *   // Modify cart
 *   await cartService.addItem(cartId, variantId);
 * } finally {
 *   await lock.release();
 * }
 */

export interface CartLock {
  release(): Promise<void>;
}

@Injectable()
export class CartLockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CartLockService.name);
  private readonly redis: Redis;
  private readonly lockPrefix = "cart:lock:";
  private readonly defaultTtl = 10000; // 10 seconds

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "redis",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  /**
   * Acquire a distributed lock for a cart
   * @param cartId The cart to lock
   * @param timeoutMs Maximum time to hold the lock
   * @returns A lock object with a release() method
   */
  async acquireLock(cartId: string, timeoutMs: number = this.defaultTtl): Promise<CartLock> {
    const lockKey = `${this.lockPrefix}${cartId}`;
    const lockValue = `${Date.now()}:${Math.random()}`;
    const maxAttempts = 10;
    let attempts = 0;

    // Spin until lock acquired or timeout
    while (attempts < maxAttempts) {
      const acquired = await this.redis.set(lockKey, lockValue, "PX", timeoutMs, "NX");
      if (acquired === "OK") {
        this.logger.debug(`Lock acquired for cart ${cartId}`);
        return {
          release: async () => {
            // Only delete if it's still our lock (compare-and-delete)
            const script = `
              if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
              else
                return 0
              end
            `;
            await this.redis.eval(script, 1, lockKey, lockValue);
            this.logger.debug(`Lock released for cart ${cartId}`);
          },
        };
      }

      attempts++;
      // Exponential backoff: 10ms, 20ms, 40ms, etc.
      const backoffMs = Math.min(10 * Math.pow(2, attempts - 1), 500);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }

    throw new Error(`Failed to acquire lock for cart ${cartId} after ${maxAttempts} attempts`);
  }

  /**
   * Async initialization (connect to Redis)
   */
  async onModuleInit() {
    // Redis client connects automatically, but verify connection
    await this.redis.ping();
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    await this.redis.disconnect();
  }
}
