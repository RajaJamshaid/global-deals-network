import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool } from "../../src/config/database.js";
import { getSeededMarketId, getSeededMerchantId, uniqueSlug } from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Offers API", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  async function createTestProduct(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "Offer Test Product", slug: uniqueSlug("offer-product") },
    });
    return response.json().data.product_id;
  }

  it("creates an offer", async () => {
    const [productId, merchantId, marketId] = await Promise.all([
      createTestProduct(),
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
        offer_url: "https://example.com/product",
        price: 19.99,
        currency: "USD",
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().data.status).toBe("active");
  });

  it("rejects a duplicate offer for the same product+merchant+market (409)", async () => {
    const [productId, merchantId, marketId] = await Promise.all([
      createTestProduct(),
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);

    const payload = {
      product_id: productId,
      merchant_id: merchantId,
      market_id: marketId,
      offer_url: "https://example.com/dup",
      price: 9.99,
      currency: "USD",
    };

    const first = await app.inject({ method: "POST", url: "/api/v1/offers", payload });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({ method: "POST", url: "/api/v1/offers", payload });
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe("CONFLICT");
  });

  it("rejects an offer with an invalid foreign key (400)", async () => {
    const marketId = await getSeededMarketId(app);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: "00000000-0000-0000-0000-000000000000",
        merchant_id: "00000000-0000-0000-0000-000000000000",
        market_id: marketId,
        offer_url: "https://example.com",
        price: 5,
        currency: "USD",
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it("lists offers filtered by product_id and gets an offer by id", async () => {
    const [productId, merchantId, marketId] = await Promise.all([
      createTestProduct(),
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: merchantId,
        market_id: marketId,
        offer_url: "https://example.com/list",
        price: 12,
        currency: "USD",
      },
    });
    const offerId = created.json().data.offer_id;

    const listResponse = await app.inject({
      method: "GET",
      url: `/api/v1/offers?product_id=${productId}`,
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().data.length).toBe(1);

    const getResponse = await app.inject({ method: "GET", url: `/api/v1/offers/${offerId}` });
    expect(getResponse.statusCode).toBe(200);
  });

  it("updates an offer's price", async () => {
    const [productId, merchantId, marketId] = await Promise.all([
      createTestProduct(),
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: merchantId,
        market_id: marketId,
        offer_url: "https://example.com/update",
        price: 25,
        currency: "USD",
      },
    });
    const offerId = created.json().data.offer_id;

    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/offers/${offerId}`,
      payload: { price: 30 },
    });
    expect(response.statusCode).toBe(200);
    expect(Number(response.json().data.price)).toBe(30);
  });

  it("deactivates an offer on delete (status = removed)", async () => {
    const [productId, merchantId, marketId] = await Promise.all([
      createTestProduct(),
      getSeededMerchantId(app),
      getSeededMarketId(app),
    ]);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: merchantId,
        market_id: marketId,
        offer_url: "https://example.com/delete",
        price: 8,
        currency: "USD",
      },
    });
    const offerId = created.json().data.offer_id;

    const deleteResponse = await app.inject({ method: "DELETE", url: `/api/v1/offers/${offerId}` });
    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await app.inject({ method: "GET", url: `/api/v1/offers/${offerId}` });
    expect(getResponse.json().data.status).toBe("removed");
  });
});
