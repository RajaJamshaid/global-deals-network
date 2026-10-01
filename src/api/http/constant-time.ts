import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison for secrets (API keys, webhook
 * secrets). Both inputs are hashed to a fixed 32-byte digest first, so
 * the comparison always runs over equal-length buffers: neither the
 * position of the first mismatch nor the length of the secret leaks
 * through timing.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a, "utf8").digest();
  const digestB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(digestA, digestB);
}
