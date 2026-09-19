import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool } from "../../src/config/database.js";

/**
 * Real PostgreSQL integration tests, same convention as
 * tests/integration/database.test.ts: skipped (not faked) when
 * DATABASE_URL isn't set, so `npm test` still passes without a
 * database configured locally; CI always sets DATABASE_URL, so these
 * genuinely execute there.
 */
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Markets API", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  it("lists markets including the seeded USA market", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/markets" });
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.total).toBeGreaterThan(0);

    const us = body.data.find((market: { code: string }) => market.code === "US");
    expect(us).toBeDefined();
    expect(us.currency).toBe("USD");
  });

  it("gets an existing market by id", async () => {
    const list = await app.inject({ method: "GET", url: "/api/v1/markets?limit=100" });
    const us = list.json().data.find((market: { code: string }) => market.code === "US");

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/markets/${us.market_id}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.code).toBe("US");
  });

  it("returns 404 for a missing market", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/markets/00000000-0000-0000-0000-000000000000",
    });
    expect(response.statusCode).toBe(404);
    expect(response.json().success).toBe(false);
    expect(response.json().error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("returns 400 for an invalid market id", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/markets/not-a-uuid" });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });
});
