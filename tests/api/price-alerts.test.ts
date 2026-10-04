import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { generatePriceAlertsForProduct } from "../../src/alert/price-alert.service.js";
import { closePool, getPool } from "../../src/config/database.js";
import { TEST_BOT_TOKEN, tmaHeaders } from "../helpers/telegram-init-data.js";
import { buildAuthedServer, getSeededMarketId, uniqueSlug } from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

let telegramIdCounter = 0;
function newTelegramId(): number {
  telegramIdCounter += 1;
  return 800_000_000 + Math.floor(Math.random() * 1_000_000_000) + telegramIdCounter;
}

describe.skipIf(!hasDatabase)("Price alert events", () => {
  const app = buildAuthedServer({ telegramBotToken: TEST_BOT_TOKEN });

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  async function createMerchant(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Alert Merchant", slug: uniqueSlug("alert-merchant") },
    });
    return response.json().data.merchant_id;
  }

  async function createProduct(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "Alert Product", slug: uniqueSlug("alert-product") },
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

  async function patchOffer(offerId: string, payload: Record<string, unknown>): Promise<void> {
    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/offers/${offerId}`,
      payload,
    });
    expect(response.statusCode).toBe(200);
  }

  async function watch(
    telegramId: number,
    productId: string,
    marketId: string,
    targetPrice?: number,
  ): Promise<void> {
    const response = await app.inject({
      method: "POST",
      url: `/api/v1/products/${productId}/watch`,
      headers: tmaHeaders(telegramId),
      payload: targetPrice === undefined ? { market_id: marketId } : { market_id: marketId, target_price: targetPrice },
    });
    expect([200, 201]).toContain(response.statusCode);
  }

  async function events(productId: string): Promise<any[]> {
    const { rows } = await getPool().query(
      "SELECT * FROM price_alert_event WHERE product_id = $1 ORDER BY created_at, alert_event_id",
      [productId],
    );
    return rows;
  }

  /** A product with one in-stock offer at `price`, watched by one user at `target`. */
  async function watchedProduct(
    price: number,
    target: number | undefined,
    offerExtra: Record<string, unknown> = {},
  ) {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    const merchantId = await createMerchant();
    const offerId = await createOffer(productId, merchantId, marketId, price, offerExtra);
    const telegramId = newTelegramId();
    await watch(telegramId, productId, marketId, target);
    return { marketId, productId, merchantId, offerId, telegramId };
  }

  it("creates a pending event when the price reaches the target - and nothing is claimed as sent", async () => {
    const { productId, merchantId, offerId } = await watchedProduct(100, 90);
    expect(await events(productId)).toHaveLength(0);

    await patchOffer(offerId, { price: 85 });

    const created = await events(productId);
    expect(created).toHaveLength(1);
    const event = created[0];
    expect(event.event_type).toBe("target_price_reached");
    expect(event.status).toBe("pending");
    expect(event.delivery_channel).toBeNull();
    expect(event.sent_at).toBeNull();
    expect(event.error_message).toBeNull();
    expect(Number(event.trigger_price)).toBe(85);
    expect(Number(event.previous_price)).toBe(100);
    expect(Number(event.target_price)).toBe(90);
    expect(event.currency).toBe("USD");
    expect(event.offer_id).toBe(offerId);
    expect(event.merchant_id).toBe(merchantId);
    expect(event.history_id).not.toBeNull();
  });

  it("is idempotent: running the service again never duplicates an event", async () => {
    const { productId, marketId, offerId } = await watchedProduct(100, 90);
    await patchOffer(offerId, { price: 85 });
    expect(await events(productId)).toHaveLength(1);

    for (let run = 0; run < 3; run += 1) {
      const result = await generatePriceAlertsForProduct(productId, marketId);
      expect(result.eligibleWatches).toBe(1);
      expect(result.eventsCreated).toBe(0);
    }
    expect(await events(productId)).toHaveLength(1);

    // Re-saving the same price records no new observation, so no new event.
    await patchOffer(offerId, { price: 85 });
    expect(await events(productId)).toHaveLength(1);
  });

  it("raises a new event for a new, lower price observation", async () => {
    const { productId, offerId } = await watchedProduct(100, 90);
    await patchOffer(offerId, { price: 85 });
    await patchOffer(offerId, { price: 84 });

    const created = await events(productId);
    expect(created).toHaveLength(2);
    expect(new Set(created.map((event) => event.history_id)).size).toBe(2);
    expect(created.map((event) => Number(event.trigger_price))).toEqual([85, 84]);
  });

  it("alerts when the price is exactly the target, but not above it", async () => {
    const equal = await watchedProduct(100, 90);
    await patchOffer(equal.offerId, { price: 90 });
    expect(await events(equal.productId)).toHaveLength(1);

    const above = await watchedProduct(100, 90);
    await patchOffer(above.offerId, { price: 95 });
    expect(await events(above.productId)).toHaveLength(0);
  });

  it("does not alert a watch that has no target price", async () => {
    const { productId, offerId } = await watchedProduct(100, undefined);
    await patchOffer(offerId, { price: 50 });
    expect(await events(productId)).toHaveLength(0);
  });

  it("does not alert an inactive (removed) watch", async () => {
    const { productId, marketId, offerId, telegramId } = await watchedProduct(100, 90);
    const removed = await app.inject({
      method: "DELETE",
      url: `/api/v1/products/${productId}/watch?market_id=${marketId}`,
      headers: tmaHeaders(telegramId),
    });
    expect(removed.statusCode).toBe(204);

    await patchOffer(offerId, { price: 80 });
    expect(await events(productId)).toHaveLength(0);
  });

  it("does not alert on an out-of-stock price", async () => {
    const { productId, offerId } = await watchedProduct(100, 90);
    await patchOffer(offerId, { price: 80, availability_status: "out_of_stock" });
    expect(await events(productId)).toHaveLength(0);
  });

  it("does not alert on sample (fixture) offers", async () => {
    const { productId, offerId } = await watchedProduct(100, 90, { is_fixture: true });
    await patchOffer(offerId, { price: 80 });
    expect(await events(productId)).toHaveLength(0);
  });

  it("alerts each user only when their own target is reached", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    const offerId = await createOffer(productId, await createMerchant(), marketId, 100);
    await watch(newTelegramId(), productId, marketId, 95);
    await watch(newTelegramId(), productId, marketId, 90);

    await patchOffer(offerId, { price: 92 }); // meets only the 95 target
    let created = await events(productId);
    expect(created.map((event) => Number(event.target_price))).toEqual([95]);

    await patchOffer(offerId, { price: 85 }); // meets both
    created = await events(productId);
    const byTarget = (target: number) =>
      created.filter((event) => Number(event.target_price) === target).length;
    expect(created).toHaveLength(3);
    expect(byTarget(95)).toBe(2);
    expect(byTarget(90)).toBe(1);
  });

  it("uses the best usable offer across merchants (existing effective-price ranking)", async () => {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    await createOffer(productId, await createMerchant(), marketId, 100);
    await watch(newTelegramId(), productId, marketId, 96);
    expect(await events(productId)).toHaveLength(0);

    // A second merchant undercuts the first and crosses the target.
    const cheaperMerchant = await createMerchant();
    const cheaperOffer = await createOffer(productId, cheaperMerchant, marketId, 95);

    const created = await events(productId);
    expect(created).toHaveLength(1);
    expect(created[0].merchant_id).toBe(cheaperMerchant);
    expect(created[0].offer_id).toBe(cheaperOffer);
    expect(Number(created[0].trigger_price)).toBe(95);
  });

  it("never lets alert bookkeeping break an offer update", async () => {
    const { offerId, productId } = await watchedProduct(100, 90);
    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/offers/${offerId}`,
      payload: { price: 70 },
    });
    expect(response.statusCode).toBe(200);
    expect(Number(response.json().data.price)).toBe(70);
    expect((await events(productId)).length).toBeGreaterThanOrEqual(1);
  });
});
