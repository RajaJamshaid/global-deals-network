import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool } from "../../src/config/database.js";
import { getSeededMarketId, uniqueSlug } from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Product Price Comparison API", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  async function createMerchant(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Comparison Merchant", slug: uniqueSlug("comparison-merchant") },
    });
    return response.json().data.merchant_id;
  }

  async function createProduct(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "Comparison Product", slug: uniqueSlug("comparison-product") },
    });
    return response.json().data.product_id;
  }

  async function createOffer(
    productId: string,
    merchantId: string,
    marketId: string,
    price: number,
    status?: string,
  ): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: merchantId,
        market_id: marketId,
        offer_url: `https://example.com/product/${randomUUID()}`,
        price,
        currency: "USD",
        ...(status ? { status } : {}),
      },
    });
    return response.json().data.offer_id;
  }

  it("compares offers from multiple merchants and identifies the lowest price", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    const [merchantA, merchantB, merchantC] = await Promise.all([
      createMerchant(),
      createMerchant(),
      createMerchant(),
    ]);

    await Promise.all([
      createOffer(productId, merchantA, marketId, 99.99),
      createOffer(productId, merchantB, marketId, 94.99),
      createOffer(productId, merchantC, marketId, 102.0),
    ]);

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}/comparison?market_id=${marketId}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.comparison.offer_count).toBe(3);
    expect(body.data.comparison.lowest_price.amount).toBe(94.99);
    expect(body.data.comparison.lowest_price.currency).toBe("USD");

    for (const entry of body.data.offers) {
      expect(entry.merchant).toBeDefined();
      expect(typeof entry.affiliate_available).toBe("boolean");
    }
  });

  it("excludes non-active (unavailable) offers from the comparison", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    const merchantId = await createMerchant();

    // Active, cheap offer.
    await createOffer(productId, merchantId, marketId, 50);
    // A second merchant's offer, created then immediately deactivated
    // via DELETE, so it should NOT appear in the comparison even
    // though its price would otherwise be lowest.
    const otherMerchant = await createMerchant();
    const removedOfferId = await createOffer(productId, otherMerchant, marketId, 1);
    await app.inject({ method: "DELETE", url: `/api/v1/offers/${removedOfferId}` });

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}/comparison?market_id=${marketId}`,
    });

    const body = response.json();
    expect(body.data.comparison.offer_count).toBe(1);
    expect(body.data.comparison.lowest_price.amount).toBe(50);
  });

  it("isolates comparisons by market - a USA-only offer must not appear when comparing a different market", async () => {
    const usaMarketId = await getSeededMarketId(app);
    const productId = await createProduct();
    const merchantId = await createMerchant();
    await createOffer(productId, merchantId, usaMarketId, 25);

    // A second, distinct market with no offers for this product.
    const pool = (await import("../../src/config/database.js")).getPool();
    const otherMarket = await pool.query(
      `INSERT INTO markets (code, name, currency, language, timezone)
       VALUES ($1, 'Comparison Isolation Test', 'EUR', 'en', 'UTC')
       RETURNING market_id`,
      [uniqueSlug("XX").slice(0, 8).toUpperCase()],
    );
    const otherMarketId = otherMarket.rows[0].market_id;

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}/comparison?market_id=${otherMarketId}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.comparison.offer_count).toBe(0);
    expect(body.data.comparison.lowest_price).toBeNull();

    // Confirm the USA comparison still finds it - proves the isolation
    // above is genuine market filtering, not just an empty result.
    const usaResponse = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}/comparison?market_id=${usaMarketId}`,
    });
    expect(usaResponse.json().data.comparison.offer_count).toBe(1);
  });

  it("returns 400 when market_id is missing", async () => {
    const productId = await createProduct();
    const response = await app.inject({ method: "GET", url: `/api/v1/products/${productId}/comparison` });
    expect(response.statusCode).toBe(400);
  });

  it("returns 404 for a non-existent product", async () => {
    const marketId = await getSeededMarketId(app);
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/00000000-0000-0000-0000-000000000000/comparison?market_id=${marketId}`,
    });
    expect(response.statusCode).toBe(404);
  });

  it("returns an empty comparison (not an error) for a product with no offers", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}/comparison?market_id=${marketId}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.comparison.offer_count).toBe(0);
    expect(response.json().data.comparison.lowest_price).toBeNull();
  });
});
