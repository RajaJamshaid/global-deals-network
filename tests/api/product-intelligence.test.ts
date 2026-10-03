import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../../src/config/database.js";
import {
  buildAuthedServer,
  getSeededCategoryId,
  getSeededMarketId,
  uniqueSlug,
} from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

describe.skipIf(!hasDatabase)("Product intelligence API (GET /products/:id?market_id=)", () => {
  const app = buildAuthedServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  async function createMerchant(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Intelligence Merchant", slug: uniqueSlug("intel-merchant") },
    });
    return response.json().data.merchant_id;
  }

  async function createProduct(extra: Record<string, unknown> = {}): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "Intelligence Product", slug: uniqueSlug("intel-product"), ...extra },
    });
    return response.json().data.product_id;
  }

  async function createOffer(
    productId: string,
    merchantId: string,
    marketId: string,
    price: number,
    extra: Record<string, unknown> = {},
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
        ...extra,
      },
    });
    expect(response.statusCode).toBe(201);
    return response.json().data.offer_id;
  }

  /** Inserts `count` daily observations at `price`, starting 1 day ago. */
  async function insertHistory(
    productId: string,
    merchantId: string,
    marketId: string,
    offerId: string,
    price: number,
    count: number,
    isFixture = false,
  ): Promise<void> {
    const pool = getPool();
    for (let day = 1; day <= count; day += 1) {
      await pool.query(
        `INSERT INTO product_price_history
           (product_id, merchant_id, market_id, offer_id, price, currency, source, is_fixture, observed_at)
         VALUES ($1, $2, $3, $4, $5, 'USD', $6, $7, now() - make_interval(days => $8::int))`,
        [productId, merchantId, marketId, offerId, price, isFixture ? "fixture" : "offer_update", isFixture, day],
      );
    }
  }

  async function detail(productId: string, marketId: string): Promise<{ status: number; body: any }> {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}?market_id=${marketId}`,
    });
    return { status: response.statusCode, body: response.json() };
  }

  it("returns the product-detail response for a product with one offer", async () => {
    const marketId = await getSeededMarketId(app);
    const categoryId = await getSeededCategoryId(app);
    const productId = await createProduct({
      brand: "Acme",
      description: "A test product",
      image_url: "https://example.com/image.png",
      category_id: categoryId,
    });
    const merchantId = await createMerchant();
    const offerId = await createOffer(productId, merchantId, marketId, 100);

    const { status, body } = await detail(productId, marketId);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    const data = body.data;

    expect(data.product_id).toBe(productId);
    expect(data.name).toBe("Intelligence Product");
    expect(data.brand).toBe("Acme");
    expect(data.description).toBe("A test product");
    expect(data.image_url).toBe("https://example.com/image.png");
    expect(data.category.slug).toBe("electronics");
    expect(data.market.code).toBe("US");
    expect(data.market.market_id).toBe(marketId);

    expect(data.offer_count).toBe(1);
    expect(data.best_offer_id).toBe(offerId);
    expect(data.availability.any_in_stock).toBe(true);
    expect(data.availability.in_stock_offer_count).toBe(1);

    const offer = data.offers[0];
    expect(offer.rank).toBe(1);
    expect(offer.listed_price).toBe(100);
    expect(offer.currency).toBe("USD");
    expect(offer.effective_price).toBe(100);
    expect(offer.applied_adjustments).toEqual([]);
    expect(offer.availability_status).toBe("in_stock");
    expect(offer.in_stock).toBe(true);
    expect(offer.is_fixture).toBe(false);
    expect(offer.merchant.merchant_id).toBe(merchantId);
    // The raw merchant URL is never exposed; CTAs go through the redirect.
    expect(offer.offer_url).toBeUndefined();

    expect(data.effective_price).toEqual({
      listed_price: 100,
      effective_price: 100,
      total_discount: 0,
      currency: "USD",
      applied_adjustments: [],
    });
  });

  it("does not invent shipping, coupons, cashback, ratings, reviews or buyer counts", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    await createOffer(productId, await createMerchant(), marketId, 10);

    const { body } = await detail(productId, marketId);
    const offer = body.data.offers[0];
    expect(offer.shipping).toBeNull();
    expect(offer.coupon).toBeNull();
    expect(offer.cashback).toBeNull();
    expect(body.data.data_availability).toEqual({
      shipping: false,
      coupons: false,
      cashback: false,
      ratings: false,
      reviews: false,
      buyer_counts: false,
    });
    for (const key of ["rating", "ratings", "reviews", "review_count", "buyer_count"]) {
      expect(body.data[key]).toBeUndefined();
    }
  });

  it("returns 404 in the standard error format for an unknown product or market", async () => {
    const marketId = await getSeededMarketId(app);

    const unknownProduct = await detail(ZERO_UUID, marketId);
    expect(unknownProduct.status).toBe(404);
    expect(unknownProduct.body.success).toBe(false);
    expect(unknownProduct.body.error.code).toBe("RESOURCE_NOT_FOUND");

    const productId = await createProduct();
    const unknownMarket = await detail(productId, ZERO_UUID);
    expect(unknownMarket.status).toBe(404);
    expect(unknownMarket.body.error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("validates the product id and market id", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();

    const badProduct = await app.inject({
      method: "GET",
      url: `/api/v1/products/not-a-uuid?market_id=${marketId}`,
    });
    expect(badProduct.statusCode).toBe(400);
    expect(badProduct.json().error.code).toBe("VALIDATION_ERROR");

    for (const value of ["not-a-uuid", ""]) {
      const badMarket = await app.inject({
        method: "GET",
        url: `/api/v1/products/${productId}?market_id=${value}`,
      });
      expect(badMarket.statusCode).toBe(400);
      expect(badMarket.json().error.code).toBe("VALIDATION_ERROR");
    }

    const repeated = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}?market_id=${marketId}&market_id=${marketId}`,
    });
    expect(repeated.statusCode).toBe(400);
  });

  it("keeps the original plain product response when no market_id is given", async () => {
    const productId = await createProduct();
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}`,
    });
    expect(response.statusCode).toBe(200);
    const data = response.json().data;
    expect(data.product_id).toBe(productId);
    expect(data.slug).toBeDefined();
    // None of the market-specific intelligence fields.
    expect(data.offers).toBeUndefined();
    expect(data.deal_score).toBeUndefined();
    expect(data.price_status).toBeUndefined();
  });

  it("isolates markets: an offer in one market never appears in another", async () => {
    const usaMarketId = await getSeededMarketId(app);
    const productId = await createProduct();
    await createOffer(productId, await createMerchant(), usaMarketId, 25);

    const pool = getPool();
    const other = await pool.query(
      `INSERT INTO markets (code, name, currency, language, timezone)
       VALUES ($1, 'Intelligence Isolation Test', 'EUR', 'en', 'UTC')
       RETURNING market_id`,
      [uniqueSlug("XX").slice(0, 8).toUpperCase()],
    );
    const otherMarketId = other.rows[0].market_id;

    const otherResult = await detail(productId, otherMarketId);
    expect(otherResult.status).toBe(200);
    expect(otherResult.body.data.market.currency).toBe("EUR");
    expect(otherResult.body.data.offer_count).toBe(0);
    expect(otherResult.body.data.offers).toEqual([]);
    expect(otherResult.body.data.best_offer_id).toBeNull();
    expect(otherResult.body.data.effective_price).toBeNull();
    expect(otherResult.body.data.price_status.status).toBe("not_enough_data");
    expect(otherResult.body.data.deal_score.score).toBeNull();

    const usaResult = await detail(productId, usaMarketId);
    expect(usaResult.body.data.offer_count).toBe(1);
  });

  it("ranks multiple merchants by effective price (lowest first)", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    const [a, b, c] = await Promise.all([createMerchant(), createMerchant(), createMerchant()]);
    await createOffer(productId, a, marketId, 99.99);
    const cheapest = await createOffer(productId, b, marketId, 94.99);
    await createOffer(productId, c, marketId, 102);

    const { body } = await detail(productId, marketId);
    expect(body.data.offer_count).toBe(3);
    expect(body.data.offers.map((o: { listed_price: number }) => o.listed_price)).toEqual([94.99, 99.99, 102]);
    expect(body.data.offers.map((o: { rank: number }) => o.rank)).toEqual([1, 2, 3]);
    expect(body.data.offers.map((o: { effective_price: number }) => o.effective_price)).toEqual([94.99, 99.99, 102]);
    expect(body.data.best_offer_id).toBe(cheapest);
    expect(body.data.effective_price.effective_price).toBe(94.99);
  });

  it("ranks an out-of-stock offer after in-stock offers, even if it is cheaper", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    const inStock = await createOffer(productId, await createMerchant(), marketId, 80);
    await createOffer(productId, await createMerchant(), marketId, 1, {
      availability_status: "out_of_stock",
    });

    const { body } = await detail(productId, marketId);
    expect(body.data.offers[0].offer_id).toBe(inStock);
    expect(body.data.offers[1].in_stock).toBe(false);
    expect(body.data.offers[1].rank).toBe(2);
    expect(body.data.availability.in_stock_offer_count).toBe(1);
    expect(body.data.availability.out_of_stock_offer_count).toBe(1);
  });

  it("reports NOT ENOUGH DATA and no score when there is little real price history", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    await createOffer(productId, await createMerchant(), marketId, 100);

    const { body } = await detail(productId, marketId);
    expect(body.data.price_status.status).toBe("not_enough_data");
    expect(body.data.price_status.verdict).toBe("insufficient_data");
    expect(body.data.price_status.average_price).toBeNull();
    expect(body.data.price_status.message).toBe("Price history is building as GDN collects more data.");
    // No price evidence at all: no fabricated score.
    expect(body.data.deal_score.score).toBeNull();
    expect(body.data.deal_score.rating).toBe("unrated");
  });

  it("integrates price status and Deal Score from real observations (LOW)", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    const merchantId = await createMerchant();
    const offerId = await createOffer(productId, merchantId, marketId, 80, { original_price: 100 });
    await insertHistory(productId, merchantId, marketId, offerId, 100, 10);

    const { body } = await detail(productId, marketId);
    const status = body.data.price_status;
    expect(status.status).toBe("low");
    expect(status.verdict).toBe("strong_deal");
    expect(status.difference_pct).toBeLessThanOrEqual(-7);
    expect(status.observation_count).toBe(11);
    expect(status.scored_offer_id).toBe(offerId);

    const score = body.data.deal_score;
    expect(score.score).not.toBeNull();
    expect(score.score).toBeGreaterThanOrEqual(60);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.scored_offer_id).toBe(offerId);
    expect(score.reasons.join(" ")).toMatch(/below 30-day average/);
    expect(score.reasons.join(" ")).not.toMatch(/verified/i);
    expect(Array.isArray(score.signals)).toBe(true);
  });

  it("reports HIGH when the current price is well above the stored average", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    const merchantId = await createMerchant();
    const offerId = await createOffer(productId, merchantId, marketId, 120);
    await insertHistory(productId, merchantId, marketId, offerId, 100, 10);

    const { body } = await detail(productId, marketId);
    expect(body.data.price_status.status).toBe("high");
    expect(body.data.price_status.verdict).toBe("wait");
    expect(body.data.price_status.difference_pct).toBeGreaterThanOrEqual(7);
  });

  it("excludes fixture observations from price status and the score", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    const merchantId = await createMerchant();
    // A REAL offer whose stored history is entirely fixture rows.
    const offerId = await createOffer(productId, merchantId, marketId, 50);
    await insertHistory(productId, merchantId, marketId, offerId, 100, 10, true);

    const { body } = await detail(productId, marketId);
    // Only the real observation recorded for the offer itself counts.
    expect(body.data.price_status.observation_count).toBe(1);
    expect(body.data.price_status.status).toBe("not_enough_data");
    expect(body.data.deal_score.score).toBeNull();
  });

  it("flags fixture offers and does not score them as real deals", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    await createOffer(productId, await createMerchant(), marketId, 80, {
      original_price: 100,
      is_fixture: true,
    });

    const { body } = await detail(productId, marketId);
    expect(body.data.offers[0].is_fixture).toBe(true);
    expect(body.data.price_status.status).toBe("not_enough_data");
    expect(body.data.deal_score.score).toBeNull();
    expect(body.data.deal_score.rating).toBe("unrated");
    expect(body.data.deal_score.reasons.join(" ")).toMatch(/not scored/);
  });

  it("caps the Deal Score when the best offer is out of stock", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    const merchantId = await createMerchant();
    const offerId = await createOffer(productId, merchantId, marketId, 80, {
      original_price: 100,
      availability_status: "out_of_stock",
    });
    await insertHistory(productId, merchantId, marketId, offerId, 100, 10);

    const { body } = await detail(productId, marketId);
    expect(body.data.availability.any_in_stock).toBe(false);
    expect(body.data.deal_score.score).not.toBeNull();
    expect(body.data.deal_score.score).toBeLessThanOrEqual(40);
    expect(body.data.deal_score.reasons).toContain("Currently out of stock");
  });

  it("leaves the existing comparison endpoint unchanged", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    await createOffer(productId, await createMerchant(), marketId, 42);

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}/comparison?market_id=${marketId}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.comparison.offer_count).toBe(1);
    expect(response.json().data.comparison.lowest_price.amount).toBe(42);
  });
});
