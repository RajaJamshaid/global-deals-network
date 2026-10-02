import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";

/**
 * Dedicated tests for the internal API key guard. These need no
 * database: every guarded request here either is rejected by the
 * guard (401) or is stopped by request validation (400/404) before
 * any database access.
 */
const KEY = "test-internal-api-key-for-guard-tests-0123456789";

const GUARDED_REQUESTS: Array<[string, string]> = [
  ["POST", "/api/v1/products"],
  ["PATCH", "/api/v1/products/not-a-uuid"],
  ["DELETE", "/api/v1/products/not-a-uuid"],
  ["POST", "/api/v1/merchants"],
  ["PATCH", "/api/v1/merchants/not-a-uuid"],
  ["DELETE", "/api/v1/merchants/not-a-uuid"],
  ["POST", "/api/v1/offers"],
  ["PATCH", "/api/v1/offers/not-a-uuid"],
  ["DELETE", "/api/v1/offers/not-a-uuid"],
  ["POST", "/api/v1/deals"],
  ["PATCH", "/api/v1/deals/not-a-uuid"],
  ["DELETE", "/api/v1/deals/not-a-uuid"],
  ["POST", "/api/v1/affiliate-links"],
  // No PUT routes exist today; the guard still covers the method.
  ["PUT", "/api/v1/offers/not-a-uuid"],
];

describe("Internal API key guard (key configured)", () => {
  const app = buildServer({ internalApiKey: KEY });

  afterAll(async () => {
    await app.close();
  });

  it("rejects a write with no Authorization header (401, standard error format)", async () => {
    const response = await app.inject({ method: "POST", url: "/api/v1/offers", payload: {} });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
    expect(response.headers["www-authenticate"]).toBe("Bearer");
  });

  it("rejects a wrong key (401)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      headers: { authorization: "Bearer not-the-right-key" },
      payload: {},
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a key that is only a prefix of, or longer than, the real key (401)", async () => {
    for (const token of [KEY.slice(0, -1), `${KEY}x`]) {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/offers",
        headers: { authorization: `Bearer ${token}` },
        payload: {},
      });
      expect(response.statusCode).toBe(401);
    }
  });

  it("rejects a non-Bearer scheme or an empty token (401)", async () => {
    for (const header of [`Basic ${KEY}`, KEY, "Bearer", "Bearer "]) {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/offers",
        headers: { authorization: header },
        payload: {},
      });
      expect(response.statusCode).toBe(401);
    }
  });

  it("allows a write with the correct key (guard passes; request validation answers)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      headers: { authorization: `Bearer ${KEY}` },
      payload: {},
    });
    // An empty body is invalid, so 400 proves the guard let it through.
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it.each(GUARDED_REQUESTS)("%s %s requires the key", async (method, url) => {
    const without = await app.inject({
      method: method as "POST" | "PATCH" | "PUT" | "DELETE",
      url,
      payload: {},
    });
    expect(without.statusCode).toBe(401);

    const withKey = await app.inject({
      method: method as "POST" | "PATCH" | "PUT" | "DELETE",
      url,
      headers: { authorization: `Bearer ${KEY}` },
      payload: {},
    });
    expect(withKey.statusCode).not.toBe(401);
  });

  it("keeps GET public", async () => {
    const health = await app.inject({ method: "GET", url: "/api/v1/health" });
    expect(health.statusCode).toBe(200);

    // Reaches the handler (which validates input) instead of being rejected.
    const search = await app.inject({ method: "GET", url: "/api/v1/products/search" });
    expect(search.statusCode).toBe(400);
  });

  it("keeps HEAD and OPTIONS public", async () => {
    const head = await app.inject({ method: "HEAD", url: "/api/v1/health" });
    expect(head.statusCode).toBe(200);

    const options = await app.inject({ method: "OPTIONS", url: "/api/v1/offers" });
    expect(options.statusCode).not.toBe(401);
  });

  it("never echoes the key in a response", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      headers: { authorization: `Bearer ${KEY}` },
      payload: {},
    });
    expect(response.body).not.toContain(KEY);
    expect(JSON.stringify(response.headers)).not.toContain(KEY);
  });
});

describe("Internal API key guard (server key not configured - fail closed)", () => {
  const app = buildServer({ internalApiKey: undefined });

  afterAll(async () => {
    await app.close();
  });

  it("rejects every protected write with 401, whatever credential is sent", async () => {
    const headersToTry: Array<Record<string, string>> = [
      {},
      { authorization: `Bearer ${KEY}` },
      { authorization: "Bearer " },
      { authorization: "Bearer undefined" },
    ];
    for (const headers of headersToTry) {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/offers",
        headers,
        payload: {},
      });
      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHORIZED");
    }
  });

  it("still serves public GET routes", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/health" });
    expect(response.statusCode).toBe(200);
  });
});

/**
 * The Telegram webhook is exempt from the internal key and keeps its
 * own webhook-secret authentication. These two groups of tests depend
 * on whether TELEGRAM_WEBHOOK_SECRET is set in the environment (CI
 * sets it).
 */
describe.skipIf(!process.env.TELEGRAM_WEBHOOK_SECRET)(
  "Telegram webhook exemption (webhook secret configured)",
  () => {
    const app = buildServer({ internalApiKey: KEY });

    afterAll(async () => {
      await app.close();
    });

    it("accepts a webhook call with the webhook secret and NO internal API key", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/telegram/webhook",
        headers: {
          "x-telegram-bot-api-secret-token": process.env.TELEGRAM_WEBHOOK_SECRET as string,
        },
        payload: {},
      });
      expect(response.statusCode).toBe(200);
    });

    it("still rejects a webhook call with a wrong webhook secret, even with the internal key", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/telegram/webhook",
        headers: {
          authorization: `Bearer ${KEY}`,
          "x-telegram-bot-api-secret-token": "wrong-secret",
        },
        payload: {},
      });
      expect(response.statusCode).toBe(401);
    });
  },
);

describe.skipIf(Boolean(process.env.TELEGRAM_WEBHOOK_SECRET))(
  "Telegram webhook exemption (webhook secret not configured)",
  () => {
    const app = buildServer({ internalApiKey: KEY });

    afterAll(async () => {
      await app.close();
    });

    it("reaches the webhook's own handling (503) rather than the internal key guard (401)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/telegram/webhook",
        payload: {},
      });
      expect(response.statusCode).toBe(503);
    });
  },
);
