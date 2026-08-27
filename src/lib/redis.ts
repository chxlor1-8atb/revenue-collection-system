import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Check if Redis is configured
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = isRedisConfigured 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limit: 10 requests per 10 seconds per IP/Identifier
export const rateLimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
    })
  : null;

// Helper function to use rate limit gracefully
export async function checkRateLimit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!rateLimit) {
    // Graceful fallback if Redis is not configured
    return { success: true, limit: 100, remaining: 99, reset: 0 };
  }
  
  return await rateLimit.limit(identifier);
}
