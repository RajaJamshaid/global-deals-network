import { afterAll, describe, expect, it } from "vitest";
import { closePool } from "../../src/config/database.js";
import {
  buildAuthedServer,
  getSeededMarketId,
  getSeededMerchantId,
  uniqueSlug,
} from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("Price history API and observation recording", () => {
  const app = buildAuthedServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  async function createProduct(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "History Test Product", slug: uniqueSlug("history-product") },
    });
    return response.json().data.product_id;
  }

  async function createOffer(
    productId: string,
    price: number,
    extra: Record<string, unknown> = {},
  ): Promise<string> {
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
        offer_url: "https://example.com/history-test",
        price,
        currency: "USD",
        ...extra,
      },
    });
    expect(response.statusCode).toBe(201);
    return response.json().data.offer_id;
  }

  async function patchOffer(offerId: string, payload: Record<string, unknown>): Promise<void> {
    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/offers/${offerId}`,
      payload,
    });
    expect(response.statusCode).toBe(200);
  }

  async function history(productId: string, extra = ""): Promise<{ status: number; body: any }> {
    const marketId = await getSeededMarketId(app);
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}/price-history?market_id=${marketId}${extra}`,
    });
    return { status: response.statusCode, body: response.json() };
  }

  it("records a first observation when an offer is created", async () => {
    const productId = await createProduct();
    await createOffer(productId, 100);

    const { status, body } = await history(productId);
    expect(status).toBe(200);
    expect(body.data.observations).toHaveLength(1);
    expect(body.data.observations[0].price).toBe(100);
    expect(body.data.observations[0].currency).toBe("USD");
    expect(body.data.observations[0].source).toBe("offer_update");
    expect(body.data.observations[0].is_fixture).toBe(false);
    expect(body.data.days).toBe(30);
  });

  it("records a new observation only when the price actually changes", async () => {
    const productId = await createProduct();
    const offerId = await createOffer(productId, 100);

    await patchOffer(offerId, { price: 90 });
    expect((await history(productId)).body.data.observations).toHaveLength(2);

    // Same price again: no duplicate observation.
    await patchOffer(offerId, { price: 90 });
    expect((await history(productId)).body.data.observations).toHaveLength(2);

    // A non-price change: no observation.
    await patchOffer(offerId, { offer_url: "https://example.com/changed" });
    expect((await history(productId)).body.data.observations).toHaveLength(2);

    // A real change again: recorded.
    await patchOffer(offerId, { price: 95 });
    const { body } = await history(productId);
    expect(body.data.observations).toHaveLength(3);
    expect(body.data.summary.min_price).toBe(90);
    expect(body.data.summary.max_price).toBe(100);
    expect(body.data.observations.map((o: { price: number }) => o.price)).toEqual([100, 90, 95]);
  });

  it("shows a 'history is building' message when there is little data", async () => {
    const productId = await createProduct();
    await createOffer(productId, 100);
    const { body } = await history(productId);
    expect(body.data.message).toBe("Price history is building as GDN collects more data.");
  });

  it("returns an empty history with a message when nothing is recorded", async () => {
    const productId = await createProduct();
    const { status, body } = await history(productId);
    expect(status).toBe(200);
    expect(body.data.observations).toEqual([]);
    expect(body.data.summary).toBeNull();
    expect(body.data.message).toBe("Price history is building as GDN collects more data.");
  });

  it("keeps fixture observations separate from real ones", async () => {
    const productId = await createProduct();
    await createOffer(productId, 40, { is_fixture: true });

    const real = await history(productId);
    expect(real.body.data.observations).toHaveLength(0);

    const withFixtures = await history(productId, "&include_fixtures=true");
    expect(withFixtures.body.data.include_fixtures).toBe(true);
    expect(withFixtures.body.data.observations).toHaveLength(1);
    expect(withFixtures.body.data.observations[0].is_fixture).toBe(true);
    expect(withFixtures.body.data.observations[0].source).toBe("fixture");
  });

  it("supports the 7, 30 and 90 day windows", async () => {
    const productId = await createProduct();
    await createOffer(productId, 100);
    for (const days of [7, 30, 90]) {
      const { status, body } = await history(productId, `&days=${days}`);
      expect(status).toBe(200);
      expect(body.data.days).toBe(days);
      expect(body.data.observations).toHaveLength(1);
    }
  });

  it("filters by merchant_id", async () => {
    const productId = await createProduct();
    await createOffer(productId, 100);
    const { body } = await history(
      productId,
      "&merchant_id=00000000-0000-4000-8000-000000000000",
    );
    expect(body.data.observations).toHaveLength(0);
  });

  it("validates input", async () => {
    const productId = await createProduct();
    const marketId = await getSeededMarketId(app);

    const missingMarket = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}/price-history`,
    });
    expect(missingMarket.statusCode).toBe(400);

    const badDays = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}/price-history?market_id=${marketId}&days=15`,
    });
    expect(badDays.statusCode).toBe(400);

    const badId = await app.inject({
      method: "GET",
      url: `/api/v1/products/not-a-uuid/price-history?market_id=${marketId}`,
    });
    expect(badId.statusCode).toBe(400);

    const unknownProduct = await app.inject({
      method: "GET",
      url: `/api/v1/products/00000000-0000-4000-8000-000000000000/price-history?market_id=${marketId}`,
    });
    expect(unknownProduct.statusCode).toBe(404);
  });
});
