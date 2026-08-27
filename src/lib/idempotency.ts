import crypto from "crypto";
import { redis } from "./redis";

// Fast memory-level deduplication cache to block concurrent burst requests (< 10 seconds)
const inFlightLocks = new Map<string, number>();

/**
 * Generate a unique deterministic idempotency key for a specific operation
 */
export function generateIdempotencyKey(prefix: string, ...identifiers: (string | number | undefined | null)[]): string {
  const normalized = identifiers.filter(Boolean).map(String).join(":");
  return `${prefix}:${crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16)}`;
}

/**
 * Attempt to acquire an in-flight operation lock
 * @param key Unique idempotency key
 * @param ttlSeconds Lock expiry in seconds (default: 10s)
 * @returns true if lock acquired successfully, false if duplicate in-flight request is detected
 */
export async function acquireInFlightLock(key: string, ttlSeconds: number = 10): Promise<boolean> {
  if (redis) {
    try {
      const result = await redis.set(key, "locked", { nx: true, ex: ttlSeconds });
      return result === "OK";
    } catch (e) {
      console.error("Redis lock error:", e);
      // fallback to memory
    }
  }

  const now = Date.now();
  const existing = inFlightLocks.get(key);

  if (existing && existing > now) {
    return false; // Already locked by another concurrent request
  }

  inFlightLocks.set(key, now + ttlSeconds * 1000);

  // Periodic cleanup if map grows
  if (inFlightLocks.size > 1000) {
    for (const [k, exp] of inFlightLocks.entries()) {
      if (exp <= now) inFlightLocks.delete(k);
    }
  }

  return true;
}

/**
 * Release an in-flight lock
 */
export async function releaseInFlightLock(key: string) {
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch (e) {
      console.error("Redis del error:", e);
    }
  }
  inFlightLocks.delete(key);
}
