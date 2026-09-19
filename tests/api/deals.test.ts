import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool } from "../../src/config/database.js";
import { getSeededMarketId, getSeededMerchantId, uniqueSlug } from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Deals API", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  it("creates a deal", async () => {
    const [merchantId, marketId] = await Promise.all([
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/deals",
      payload: {
        merchant_id: merchantId,
        market_id: marketId,
        title: "Test Deal",
        slug: uniqueSlug("test-deal"),
        currency: "USD",
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.deal_status).toBe("draft");
    expect(body.data.verification_status).toBe("unverified");
  });

  it("rejects creation with an invalid foreign key (400)", async () => {
    const marketId = await getSeededMarketId(app);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/deals",
      payload: {
        merchant_id: "00000000-0000-0000-0000-000000000000",
        market_id: marketId,
        title: "Bad Merchant Deal",
        slug: uniqueSlug("bad-merchant-deal"),
        currency: "USD",
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it("rejects an out-of-range discount_percentage (400)", async () => {
    const [merchantId, marketId] = await Promise.all([
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/deals",
      payload: {
        merchant_id: merchantId,
        market_id: marketId,
        title: "Bad Discount Deal",
        slug: uniqueSlug("bad-discount-deal"),
        currency: "USD",
        discount_percentage: 150,
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it("lists deals filtered by merchant_id", async () => {
    const [merchantId, marketId] = await Promise.all([
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);

    await app.inject({
      method: "POST",
      url: "/api/v1/deals",
      payload: {
        merchant_id: merchantId,
        market_id: marketId,
        title: "List Deal",
        slug: uniqueSlug("list-deal"),
        currency: "USD",
      },
    });

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/deals?merchant_id=${merchantId}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().meta.total).toBeGreaterThan(0);
  });

  it("gets a deal by id", async () => {
    const [merchantId, marketId] = await Promise.all([
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);
    const slug = uniqueSlug("get-deal");
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/deals",
      payload: { merchant_id: merchantId, market_id: marketId, title: "Get Deal", slug, currency: "USD" },
    });
    const dealId = created.json().data.deal_id;

    const response = await app.inject({ method: "GET", url: `/api/v1/deals/${dealId}` });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.slug).toBe(slug);
  });

  it("returns 404 for a missing deal", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/deals/00000000-0000-0000-0000-000000000000",
    });
    expect(response.statusCode).toBe(404);
  });

  it("updates a deal", async () => {
    const [merchantId, marketId] = await Promise.all([
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/deals",
      payload: {
        merchant_id: merchantId,
        market_id: marketId,
        title: "Update Deal",
        slug: uniqueSlug("update-deal"),
        currency: "USD",
      },
    });
    const dealId = created.json().data.deal_id;

    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/deals/${dealId}`,
      payload: { deal_status: "active", featured_status: true },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.deal_status).toBe("active");
    expect(response.json().data.featured_status).toBe(true);
  });

  it("archives a deal on delete (deal_status = archived)", async () => {
    const [merchantId, marketId] = await Promise.all([
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/deals",
      payload: {
        merchant_id: merchantId,
        market_id: marketId,
        title: "Delete Deal",
        slug: uniqueSlug("delete-deal"),
        currency: "USD",
      },
    });
    const dealId = created.json().data.deal_id;

    const deleteResponse = await app.inject({ method: "DELETE", url: `/api/v1/deals/${dealId}` });
    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await app.inject({ method: "GET", url: `/api/v1/deals/${dealId}` });
    expect(getResponse.json().data.deal_status).toBe("archived");
  });
});
