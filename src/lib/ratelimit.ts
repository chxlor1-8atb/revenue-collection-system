import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Rate limiter for critical actions like QR Generation or Form Submissions
// 10 requests per 1 minute window
export const actionRateLimit = redis 
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/action",
    })
  : null;

// Rate limiter for high-volume endpoints (e.g., API polling)
// 60 requests per 1 minute window
export const apiRateLimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/api",
    })
  : null;
