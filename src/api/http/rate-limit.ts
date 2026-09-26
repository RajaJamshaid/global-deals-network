import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { tooManyRequests } from "./errors.js";

interface Bucket {
  count: number;
  windowStart: number;
}

/**
 * Minimal, dependency-free per-IP fixed-window rate limiter, per
 * CODE QUALITY ("avoid unnecessary dependencies") and
 * docs/implementation/GDN_Repository_And_Environment_Setup.md section
 * 26's "API Rate Limiting" Stage 1 minimum. In-memory only - correct
 * for Stage 1's single API process; a multi-instance deployment would
 * need a shared store (e.g. Redis) instead, which is future scope.
 *
 * Requires Fastify's `trustProxy` (see server.ts) to be enabled so
 * `request.ip` reflects the real client behind Cloudflare rather than
 * Cloudflare's edge IP - without it every visitor would share one
 * bucket.
 *
 * The Telegram webhook is exempt: it is already authenticated via
 * TELEGRAM_WEBHOOK_SECRET (see telegram.routes.ts), and that route is
 * deliberately built to always return 200 so Telegram never retries
 * a slow/broken handler - a 429 here would defeat that guarantee.
 */
const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so `buckets` doesn't grow forever
// as new IPs are seen. unref()'d so it never keeps the process alive
// on its own (relevant for tests and graceful shutdown).
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart >= env.rateLimitWindowMs) {
      buckets.delete(key);
    }
  }
}, env.rateLimitWindowMs).unref();

function isExempt(url: string): boolean {
  return url.split("?")[0].endsWith("/telegram/webhook");
}

export async function rateLimitPlugin(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (request, reply) => {
    if (isExempt(request.url)) {
      return;
    }

    const key = request.ip;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.windowStart >= env.rateLimitWindowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return;
    }

    bucket.count += 1;
    if (bucket.count > env.rateLimitMax) {
      const retryAfterSeconds = Math.ceil(
        (bucket.windowStart + env.rateLimitWindowMs - now) / 1000,
      );
      reply.header("Retry-After", String(retryAfterSeconds));
      throw tooManyRequests();
    }
  });
}
