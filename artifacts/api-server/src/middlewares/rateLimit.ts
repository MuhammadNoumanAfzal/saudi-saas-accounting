import type { RequestHandler } from "express";
import { logger } from "../lib/logger";
import { getAuthenticatedClerkUserId } from "./auth";

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type Bucket = {
  resetAt: number;
  count: number;
};

const buckets = new Map<string, Bucket>();
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisPrefix = process.env.RATE_LIMIT_REDIS_PREFIX ?? "khanbas:rate-limit";

function cleanExpiredBuckets(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function hitMemoryLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  cleanExpiredBuckets(now);

  const current = buckets.get(key);
  const bucket =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + options.windowMs };

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    count: bucket.count,
    resetAt: bucket.resetAt,
  };
}

async function hitRedisLimit(key: string, options: RateLimitOptions) {
  if (!upstashUrl || !upstashToken) return null;

  const redisKey = `${redisPrefix}:${key}`;
  const response = await fetch(`${upstashUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, String(options.windowMs)],
    ]),
  });

  if (!response.ok) {
    throw new Error(`Redis rate limit request failed with ${response.status}`);
  }

  const results = (await response.json()) as Array<{ result?: unknown }>;
  const count = Number(results[0]?.result ?? 0);

  return {
    count,
    resetAt: Date.now() + options.windowMs,
  };
}

export function rateLimit(options: RateLimitOptions): RequestHandler {
  return async (req, res, next) => {
    const subject = getAuthenticatedClerkUserId(req) ?? req.ip ?? "anonymous";
    const key = `${subject}:${req.path.split("/").slice(0, 3).join("/")}`;

    try {
      const result =
        (await hitRedisLimit(key, options)) ?? hitMemoryLimit(key, options);
      const remaining = Math.max(0, options.max - result.count);

      res.setHeader("RateLimit-Limit", String(options.max));
      res.setHeader("RateLimit-Remaining", String(remaining));
      res.setHeader("RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

      if (result.count > options.max) {
        res.status(429).json({ error: "Too many requests" });
        return;
      }

      next();
    } catch (error) {
      logger.error({ err: error }, "Redis rate limiting failed; using in-memory fallback");
      const result = hitMemoryLimit(key, options);
      if (result.count > options.max) {
        res.status(429).json({ error: "Too many requests" });
        return;
      }
      next();
    }
  };
}