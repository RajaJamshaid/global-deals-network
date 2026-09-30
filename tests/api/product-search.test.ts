import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool } from "../../src/config/database.js";
import { getSeededMarketId, getSeededMerchantId, uniqueSlug } from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Product search API", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  /** A token unique to this test run so searches never match other data. */
  function uniqueToken(): string {
    return `zq${randomUUID().replace(/-/g, "").slice(0, 10)}`;
  }

  async function createProduct(name: string, brand?: string): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name, slug: uniqueSlug("search-product"), brand },
    });
    return response.json().data.product_id;
  }

  async function createOffer(
    productId: string,
    price: number,
    extra: Record<string, unknown> = {},
  ): Promise<void> {
    const [merchantId, marketId] = await Promise.all([
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: merchantId,
        market_id: marketId,
        offer_url: "https://example.com/search-test",
        price,
        currency: "USD",
        ...extra,
      },
    });
    expect(response.statusCode).toBe(201);
  }

  async function search(q: string, extra = ""): Promise<{ status: number; body: any }> {
    const marketId = await getSeededMarketId(app);
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/search?q=${encodeURIComponent(q)}&market_id=${marketId}${extra}`,
    });
    return { status: response.statusCode, body: response.json() };
  }

  it("finds a product by name and returns best price, merchant and offer count", async () => {
    const token = uniqueToken();
    const productId = await createProduct(`${token} Widget`, "Acme");
    await createOffer(productId, 100);

    const { status, body } = await search(token);
    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    const result = body.data[0];
    expect(result.product_id).toBe(productId);
    expect(result.offer_count).toBe(1);
    expect(result.best_offer.price).toBe(100);
    expect(result.best_offer.currency).toBe("USD");
    expect(result.best_offer.merchant.slug).toBe("amazon");
    expect(result.best_offer.is_fixture).toBe(false);
    // One observation is not enough history to claim anything.
    expect(result.price_status.status).toBe("not_enough_data");
    expect(body.meta.total).toBe(1);
  });

  it("finds a product by brand and requires every term to match", async () => {
    const token = uniqueToken();
    const productId = await createProduct("Plain Gadget", `${token}brand`);
    await createOffer(productId, 50);

    const byBrand = await search(`${token}brand`);
    expect(byBrand.body.data).toHaveLength(1);

    const both = await search(`${token}brand gadget`);
    expect(both.body.data).toHaveLength(1);

    const mismatch = await search(`${token}brand nonexistentterm`);
    expect(mismatch.body.data).toHaveLength(0);
  });

  it("does not return products without an active offer in the market", async () => {
    const token = uniqueToken();
    await createProduct(`${token} No Offer`);
    const { status, body } = await search(token);
    expect(status).toBe(200);
    expect(body.data).toHaveLength(0);
  });

  it("returns nothing for a market with no offers (market isolation)", async () => {
    const token = uniqueToken();
    const productId = await createProduct(`${token} Isolation`);
    await createOffer(productId, 10);

    const otherMarket = "00000000-0000-4000-8000-000000000000";
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/search?q=${token}&market_id=${otherMarket}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(0);
  });

  it("flags fixture offers instead of presenting them as real pricing", async () => {
    const token = uniqueToken();
    const productId = await createProduct(`${token} Fixture Item`);
    await createOffer(productId, 25, { is_fixture: true });

    const { body } = await search(token);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].best_offer.is_fixture).toBe(true);
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
    const missingQ = await app.inject({
      method: "GET",
      url: `/api/v1/products/search?market_id=${marketId}`,
    });
    expect(missingQ.statusCode).toBe(400);

    const tooShort = await app.inject({
      method: "GET",
      url: `/api/v1/products/search?q=a&market_id=${marketId}`,
    });
    expect(tooShort.statusCode).toBe(400);

    const missingMarket = await app.inject({
      method: "GET",
      url: "/api/v1/products/search?q=phone",
    });
    expect(missingMarket.statusCode).toBe(400);

    const badMarket = await app.inject({
      method: "GET",
      url: "/api/v1/products/search?q=phone&market_id=not-a-uuid",
    });
    expect(badMarket.statusCode).toBe(400);
  });

  it("paginates results", async () => {
    const token = uniqueToken();
    for (const suffix of ["A", "B", "C"]) {
      const productId = await createProduct(`${token} Paged ${suffix}`);
      await createOffer(productId, 10);
    }
    const { body } = await search(token, "&limit=2&page=2");
    expect(body.meta.total).toBe(3);
    expect(body.meta.limit).toBe(2);
    expect(body.meta.page).toBe(2);
    expect(body.data).toHaveLength(1);
  });
});
