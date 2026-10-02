import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { env } from "../../src/config/env.js";

/**
 * Verifies that the CORS and rate-limit hooks are actually applied to
 * real API routes (not just registered). No database needed: the
 * health route is used throughout.
 */
describe("CORS", () => {
  const app = buildServer();
  const allowedOrigin = env.corsAllowedOrigins[0] as string;

  afterAll(async () => {
    await app.close();
  });

  it("adds Access-Control-Allow-Origin for an allowed origin on a normal route", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
      headers: { origin: allowedOrigin },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(allowedOrigin);
    expect(response.headers.vary).toContain("Origin");
  });

  it("does not allow an origin that is not in the allow-list", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
      headers: { origin: "https://not-allowed.example" },
    });
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("answers a preflight request with 204 and the allowed methods", async () => {
    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/offers",
      headers: { origin: allowedOrigin, "access-control-request-method": "GET" },
    });
    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-methods"]).toContain("GET");
    expect(response.headers["access-control-allow-origin"]).toBe(allowedOrigin);
  });
});

describe.skipIf(env.rateLimitMax > 2000)("Rate limiting", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
  });

  it("returns 429 (standard error format) once the per-IP limit is exceeded", async () => {
    // Own client IP (trustProxy is on) so no other test shares this bucket.
    const headers = { "x-forwarded-for": "203.0.113.10" };
    let last = await app.inject({ method: "GET", url: "/api/v1/health", headers });
    for (let i = 1; i <= env.rateLimitMax; i += 1) {
      last = await app.inject({ method: "GET", url: "/api/v1/health", headers });
    }
    expect(last.statusCode).toBe(429);
    expect(last.json().error.code).toBe("RATE_LIMITED");
    expect(last.headers["retry-after"]).toBeDefined();
  });

  it("does not limit a different client IP", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
      headers: { "x-forwarded-for": "203.0.113.11" },
    });
    expect(response.statusCode).toBe(200);
  });
});
