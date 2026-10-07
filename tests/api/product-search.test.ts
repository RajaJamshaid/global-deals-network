import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../../src/config/database.js";
import {
  buildAuthedServer,
  getSeededMarketId,
  getSeededMerchantId,
  uniqueSlug,
} from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Product search API (comparison-oriented)", () => {
  const app = buildAuthedServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  /** A token unique to this test run so searches never match other data. */
  function uniqueToken(): string {
    return `zq${randomUUID().replace(/-/g, "").slice(0, 10)}`;
  }

  async function createMerchant(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Search Merchant", slug: uniqueSlug("search-merchant") },
    });
    return response.json().data.merchant_id;
  }

  async function createProduct(name: string, brand?: string, extra: Record<string, unknown> = {}): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name, slug: uniqueSlug("search-product"), brand, ...extra },
    });
    return response.json().data.product_id;
  }

  async function createOffer(
    productId: string,
    price: number,
    extra: Record<string, unknown> = {},
    merchantId?: string,
  ): Promise<string> {
    const [defaultMerchant, marketId] = await Promise.all([
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: merchantId ?? defaultMerchant,
        market_id: marketId,
        offer_url: "https://example.com/search-test",
        price,
        currency: "USD",
        ...extra,
      },
    });
    expect(response.statusCode).toBe(201);
    return response.json().data.offer_id;
  }

  async function search(q: string, extra = ""): Promise<{ status: number; body: any }> {
    const marketId = await getSeededMarketId(app);
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/search?q=${encodeURIComponent(q)}&market_id=${marketId}${extra}`,
    });
    return { status: response.statusCode, body: response.json() };
  }

  it("returns each match as the start of a price comparison", async () => {
    const token = uniqueToken();
    const productId = await createProduct(`${token} Widget`, "Acme", {
      image_url: "https://example.com/widget.png",
    });
    await createOffer(productId, 100);

    const { status, body } = await search(token);
    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    const result = body.data[0];
    expect(result.product_id).toBe(productId);
    expect(result.brand).toBe("Acme");
    expect(result.image_url).toBe("https://example.com/widget.png");
    expect(Object.keys(result.market).sort()).toEqual(["code", "currency", "market_id", "name"]);
    expect(result.market.code).toBe("US");
    expect(result.offer_count).toBe(1);
    expect(result.best_offer.price).toBe(100);
    expect(result.best_offer.effective_price).toBe(100);
    expect(result.best_offer.currency).toBe("USD");
    expect(result.best_offer.merchant.slug).toBe("amazon");
    expect(result.best_offer.in_stock).toBe(true);
    expect(result.best_offer.is_fixture).toBe(false);
    // One observation is not enough history, and there is no price evidence: no score.
    expect(result.price_status.status).toBe("not_enough_data");
    expect(result.deal_score.score).toBeNull();
    expect(result.deal_score.rating).toBe("unrated");
    expect(result.compare_path).toBe(
      `/api/v1/products/${productId}?market_id=${result.market.market_id}`,
    );
    expect(result.page_path).toBe(`/product/${result.slug}`);
    expect(body.meta.total).toBe(1);
  });

  it("does not invent shipping, coupons, reviews or buyer counts", async () => {
    const token = uniqueToken();
    await createOffer(await createProduct(`${token} Plain`), 10);
    const { body } = await search(token);
    const text = JSON.stringify(body.data[0]);
    for (const key of ["review", "buyer", "shipping", "coupon", "cashback", "stars"]) {
      expect(text).not.toContain(`"${key}`);
    }
  });

  it("finds by brand and by several terms (every term must match)", async () => {
    const token = uniqueToken();
    const productId = await createProduct("Plain Gadget", `${token}brand`);
    await createOffer(productId, 50);

    expect((await search(`${token}brand`)).body.data).toHaveLength(1);
    expect((await search(`${token}brand gadget`)).body.data).toHaveLength(1);
    expect((await search(`${token}brand nonexistentterm`)).body.data).toHaveLength(0);
  });

  it("returns an empty list (the no-results state) when nothing matches", async () => {
    const { status, body } = await search(`${uniqueToken()}nomatch`);
    expect(status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });

  it("does not return products without an active offer in the market", async () => {
    const token = uniqueToken();
    await createProduct(`${token} No Offer`);
    const { status, body } = await search(token);
    expect(status).toBe(200);
    expect(body.data).toHaveLength(0);
  });

  it("isolates markets: another market sees no offers, an unknown market is unavailable", async () => {
    const token = uniqueToken();
    await createOffer(await createProduct(`${token} Isolation`), 10);

    const pool = getPool();
    const other = await pool.query(
      `INSERT INTO markets (code, name, currency, language, timezone)
       VALUES ($1, 'Search Isolation Test', 'EUR', 'en', 'UTC')
       RETURNING market_id`,
      [uniqueSlug("XX").slice(0, 8).toUpperCase()],
    );
    const otherMarket = await app.inject({
      method: "GET",
      url: `/api/v1/products/search?q=${token}&market_id=${other.rows[0].market_id}`,
    });
    expect(otherMarket.statusCode).toBe(200);
    expect(otherMarket.json().data).toHaveLength(0);

    const unknown = await app.inject({
      method: "GET",
      url: `/api/v1/products/search?q=${token}&market_id=00000000-0000-4000-8000-000000000000`,
    });
    expect(unknown.statusCode).toBe(404);
    expect(unknown.json().error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("picks the best offer by the existing ranking: in stock first, then lowest effective price", async () => {
    const token = uniqueToken();
    const productId = await createProduct(`${token} Ranked`);
    const cheapOutOfStock = await createMerchant();
    const inStockMerchant = await createMerchant();
    const priciestMerchant = await createMerchant();
    await createOffer(productId, 1, { availability_status: "out_of_stock" }, cheapOutOfStock);
    const inStockOffer = await createOffer(productId, 80, {}, inStockMerchant);
    await createOffer(productId, 120, {}, priciestMerchant);

    const { body } = await search(token);
    const result = body.data[0];
    expect(result.offer_count).toBe(3);
    expect(result.best_offer.offer_id).toBe(inStockOffer);
    expect(result.best_offer.price).toBe(80);
    expect(result.best_offer.merchant.merchant_id).toBe(inStockMerchant);
  });

  it("includes price status and a Deal Score when there is real evidence", async () => {
    const token = uniqueToken();
    const productId = await createProduct(`${token} Evidence`);
    const merchantId = await createMerchant();
    const offerId = await createOffer(productId, 80, { original_price: 100 }, merchantId);
    const marketId = await getSeededMarketId(app);
    const pool = getPool();
    for (let day = 1; day <= 10; day += 1) {
      await pool.query(
        `INSERT INTO product_price_history
           (product_id, merchant_id, market_id, offer_id, price, currency, source, is_fixture, observed_at)
         VALUES ($1, $2, $3, $4, 100, 'USD', 'offer_update', FALSE, now() - make_interval(days => $5::int))`,
        [productId, merchantId, marketId, offerId, day],
      );
    }

    const { body } = await search(token);
    const result = body.data[0];
    expect(result.price_status.status).toBe("low");
    expect(result.price_status.verdict).toBe("strong_deal");
    expect(result.deal_score.score).not.toBeNull();
    expect(result.deal_score.score).toBeGreaterThanOrEqual(60);
    expect(result.deal_score.reasons.join(" ")).toMatch(/below 30-day average/);
    expect(result.deal_score.reasons.join(" ")).not.toMatch(/verified/i);
  });

  it("flags fixture offers instead of presenting them as real pricing", async () => {
    const token = uniqueToken();
    await createOffer(await createProduct(`${token} Fixture Item`), 25, { is_fixture: true, original_price: 50 });

    const { body } = await search(token);
    expect(body.data[0].best_offer.is_fixture).toBe(true);
    expect(body.data[0].deal_score.score).toBeNull();
  });

  it("treats LIKE wildcards and SQL-looking input as plain text", async () => {
    const wildcard = await search("%%");
    expect(wildcard.status).toBe(200);
    expect(wildcard.body.data).toHaveLength(0);

    const injection = await search("'; DROP TABLE products; --");
    expect(injection.status).toBe(200);
    expect(injection.body.data).toHaveLength(0);
  });

  it("validates input", async () => {
    const marketId = await getSeededMarketId(app);
    for (const url of [
      `/api/v1/products/search?market_id=${marketId}`,
      `/api/v1/products/search?q=a&market_id=${marketId}`,
      `/api/v1/products/search?q=${"x".repeat(101)}&market_id=${marketId}`,
      "/api/v1/products/search?q=phone",
      "/api/v1/products/search?q=phone&market_id=not-a-uuid",
    ]) {
      const response = await app.inject({ method: "GET", url });
      expect(response.statusCode, url).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("paginates results", async () => {
    const token = uniqueToken();
    for (const suffix of ["A", "B", "C"]) {
      await createOffer(await createProduct(`${token} Paged ${suffix}`), 10);
    }
    const { body } = await search(token, "&limit=2&page=2");
    expect(body.meta.total).toBe(3);
    expect(body.meta.limit).toBe(2);
    expect(body.meta.page).toBe(2);
    expect(body.data).toHaveLength(1);
  });
});
