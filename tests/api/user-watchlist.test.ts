import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool, getPool } from "../../src/config/database.js";
import {
  TEST_BOT_TOKEN,
  buildInitData,
  tmaHeaders,
} from "../helpers/telegram-init-data.js";
import {
  buildAuthedServer,
  getSeededMarketId,
  internalAuthHeaders,
  uniqueSlug,
} from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

let telegramIdCounter = 0;
/** A Telegram user id no other test (or run) uses. */
function newTelegramId(): number {
  telegramIdCounter += 1;
  return 700_000_000 + Math.floor(Math.random() * 1_000_000_000) + telegramIdCounter;
}

describe.skipIf(!hasDatabase)("User watchlist API (Telegram-authenticated)", () => {
  // `app` sends the fixture internal key by default (for creating test data);
  // a test's own `tma` Authorization header overrides it on user routes.
  const app = buildAuthedServer({ telegramBotToken: TEST_BOT_TOKEN });
  // Sends exactly what the test gives it - used for anonymous / bad-credential cases.
  const rawApp = buildServer({ telegramBotToken: TEST_BOT_TOKEN });
  const noTokenApp = buildServer({ telegramBotToken: undefined });

  afterAll(async () => {
    await app.close();
    await rawApp.close();
    await noTokenApp.close();
    await closePool();
  });

  async function createMerchant(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Watch Merchant", slug: uniqueSlug("watch-merchant") },
    });
    return response.json().data.merchant_id;
  }

  async function createProduct(extra: Record<string, unknown> = {}): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "Watchlist Product", slug: uniqueSlug("watch-product"), ...extra },
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

  /** A product with one in-stock offer in the USA market. */
  async function productWithOffer(
    price = 100,
    productExtra: Record<string, unknown> = {},
  ): Promise<{ productId: string; merchantId: string; offerId: string; marketId: string }> {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct(productExtra);
    const merchantId = await createMerchant();
    const offerId = await createOffer(productId, merchantId, marketId, price);
    return { productId, merchantId, offerId, marketId };
  }

  async function insertHistory(
    productId: string,
    merchantId: string,
    marketId: string,
    offerId: string,
    price: number,
    count: number,
  ): Promise<void> {
    const pool = getPool();
    for (let day = 1; day <= count; day += 1) {
      await pool.query(
        `INSERT INTO product_price_history
           (product_id, merchant_id, market_id, offer_id, price, currency, source, is_fixture, observed_at)
         VALUES ($1, $2, $3, $4, $5, 'USD', 'offer_update', FALSE, now() - make_interval(days => $6::int))`,
        [productId, merchantId, marketId, offerId, price, day],
      );
    }
  }

  function watch(
    telegramId: number,
    productId: string,
    payload: Record<string, unknown>,
  ): Promise<{ statusCode: number; json: () => any }> {
    return app.inject({
      method: "POST",
      url: `/api/v1/products/${productId}/watch`,
      headers: tmaHeaders(telegramId),
      payload,
    });
  }

  async function watchRows(productId: string): Promise<any[]> {
    const { rows } = await getPool().query(
      "SELECT * FROM user_product_watch WHERE product_id = $1 ORDER BY created_at",
      [productId],
    );
    return rows;
  }

  // ------------------------------------------------------------------
  // Authentication
  // ------------------------------------------------------------------
  describe("authentication", () => {
    it("rejects every user route when no credential is sent", async () => {
      const marketId = await getSeededMarketId(app);
      const requests = [
        { method: "POST" as const, url: `/api/v1/products/${ZERO_UUID}/watch`, payload: { market_id: marketId } },
        { method: "DELETE" as const, url: `/api/v1/products/${ZERO_UUID}/watch?market_id=${marketId}` },
        { method: "GET" as const, url: `/api/v1/users/me/watchlist?market_id=${marketId}` },
      ];
      for (const request of requests) {
        const response = await rawApp.inject(request);
        expect(response.statusCode).toBe(401);
        expect(response.json()).toEqual({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Unauthorized" },
        });
      }
    });

    it("rejects malformed credentials", async () => {
      const marketId = await getSeededMarketId(app);
      const headersToTry = [
        "tma",
        "tma ",
        "tma garbage",
        "tma a=b&c=d",
        `Basic ${Buffer.from("user:pass").toString("base64")}`,
        "Bearer not-an-init-data-string",
        "",
      ];
      for (const authorization of headersToTry) {
        const response = await rawApp.inject({
          method: "GET",
          url: `/api/v1/users/me/watchlist?market_id=${marketId}`,
          headers: { authorization },
        });
        expect(response.statusCode).toBe(401);
      }
    });

    it("rejects invalid signatures, a wrong bot token and expired initData", async () => {
      const marketId = await getSeededMarketId(app);
      const url = `/api/v1/users/me/watchlist?market_id=${marketId}`;

      const tampered = new URLSearchParams(buildInitData({ user: { id: 1, first_name: "A" } }));
      tampered.set("user", JSON.stringify({ id: 999, first_name: "Evil" }));

      const credentials = {
        tampered: tampered.toString(),
        wrongToken: buildInitData({ botToken: "1:some-other-bot-token" }),
        expired: buildInitData({ authDate: Math.floor(Date.now() / 1000) - 3 * 86400 }),
        noUser: buildInitData({ user: null }),
      };
      for (const [name, initData] of Object.entries(credentials)) {
        const response = await rawApp.inject({
          method: "GET",
          url,
          headers: { authorization: `tma ${initData}` },
        });
        expect(response.statusCode, name).toBe(401);
      }
    });

    it("fails closed when the server has no Telegram bot token configured", async () => {
      const marketId = await getSeededMarketId(app);
      const response = await noTokenApp.inject({
        method: "GET",
        url: `/api/v1/users/me/watchlist?market_id=${marketId}`,
        headers: tmaHeaders(newTelegramId()),
      });
      expect(response.statusCode).toBe(401);
    });

    it("keeps user auth and the internal API key separate", async () => {
      const marketId = await getSeededMarketId(app);

      // The internal key is not a user credential.
      const withInternalKey = await rawApp.inject({
        method: "GET",
        url: `/api/v1/users/me/watchlist?market_id=${marketId}`,
        headers: internalAuthHeaders(),
      });
      expect(withInternalKey.statusCode).toBe(401);

      // A Telegram user credential cannot write catalog data.
      const catalogWrite = await rawApp.inject({
        method: "POST",
        url: "/api/v1/products",
        headers: tmaHeaders(newTelegramId()),
        payload: { name: "Nope", slug: uniqueSlug("nope") },
      });
      expect(catalogWrite.statusCode).toBe(401);
    });

    it("accepts valid initData and never echoes credentials back", async () => {
      const { productId, marketId } = await productWithOffer();
      const telegramId = newTelegramId();
      const headers = tmaHeaders(telegramId);
      const initData = headers.authorization.slice("tma ".length);
      const hash = new URLSearchParams(initData).get("hash") as string;

      const response = await rawApp.inject({
        method: "POST",
        url: `/api/v1/products/${productId}/watch`,
        headers,
        payload: { market_id: marketId },
      });
      expect(response.statusCode).toBe(201);

      const everything = JSON.stringify({ body: response.body, headers: response.headers });
      expect(everything).not.toContain(initData);
      expect(everything).not.toContain(hash);
      expect(everything).not.toContain(TEST_BOT_TOKEN);
      expect(response.json().data.user_id).toBeUndefined();
    });

    it("maps the verified Telegram user onto the existing users / user_identities tables", async () => {
      const { productId, marketId } = await productWithOffer();
      const telegramId = newTelegramId();
      await watch(telegramId, productId, { market_id: marketId });
      // Same user again: reuses the identity instead of creating a second user.
      await watch(telegramId, productId, { market_id: marketId });

      const { rows } = await getPool().query(
        `SELECT user_id FROM user_identities WHERE provider = 'telegram' AND provider_user_id = $1`,
        [String(telegramId)],
      );
      expect(rows).toHaveLength(1);
      expect(await watchRows(productId)).toHaveLength(1);
    });
  });

  // ------------------------------------------------------------------
  // Watch create / update / delete
  // ------------------------------------------------------------------
  describe("watch lifecycle", () => {
    it("creates, updates and clears a target price without duplicating the watch", async () => {
      const { productId, marketId } = await productWithOffer();
      const telegramId = newTelegramId();

      const created = await watch(telegramId, productId, { market_id: marketId, target_price: 99.99 });
      expect(created.statusCode).toBe(201);
      expect(created.json().success).toBe(true);
      expect(created.json().data).toMatchObject({
        product_id: productId,
        market_id: marketId,
        target_price: 99.99,
        currency: "USD",
        active: true,
      });

      const updated = await watch(telegramId, productId, { market_id: marketId, target_price: 80 });
      expect(updated.statusCode).toBe(200);
      expect(updated.json().data.target_price).toBe(80);

      // No target in the body: the existing target is kept.
      const kept = await watch(telegramId, productId, { market_id: marketId });
      expect(kept.statusCode).toBe(200);
      expect(kept.json().data.target_price).toBe(80);

      // Explicit null clears it.
      const cleared = await watch(telegramId, productId, { market_id: marketId, target_price: null });
      expect(cleared.json().data.target_price).toBeNull();

      expect(await watchRows(productId)).toHaveLength(1);
    });

    it("rounds a target price to cents", async () => {
      const { productId, marketId } = await productWithOffer();
      const response = await watch(newTelegramId(), productId, {
        market_id: marketId,
        target_price: 49.994,
      });
      expect(response.json().data.target_price).toBe(49.99);
    });

    it("never creates duplicate rows, even for concurrent requests", async () => {
      const { productId, marketId } = await productWithOffer();
      const telegramId = newTelegramId();

      const responses = await Promise.all(
        Array.from({ length: 5 }, () => watch(telegramId, productId, { market_id: marketId, target_price: 70 })),
      );
      const statuses = responses.map((response) => response.statusCode).sort();
      expect(statuses.every((status) => status === 200 || status === 201)).toBe(true);
      expect(statuses.filter((status) => status === 201)).toHaveLength(1);
      expect(await watchRows(productId)).toHaveLength(1);
    });

    it("removes a watch (204), re-activates it on the next watch, and keeps one row", async () => {
      const { productId, marketId } = await productWithOffer();
      const telegramId = newTelegramId();
      await watch(telegramId, productId, { market_id: marketId, target_price: 90 });

      const removed = await app.inject({
        method: "DELETE",
        url: `/api/v1/products/${productId}/watch?market_id=${marketId}`,
        headers: tmaHeaders(telegramId),
      });
      expect(removed.statusCode).toBe(204);
      let rows = await watchRows(productId);
      expect(rows).toHaveLength(1);
      expect(rows[0].is_active).toBe(false);

      const again = await watch(telegramId, productId, { market_id: marketId });
      expect(again.statusCode).toBe(200);
      expect(again.json().data.active).toBe(true);
      // Same market, no new target: the earlier target survives re-watching.
      expect(again.json().data.target_price).toBe(90);
      rows = await watchRows(productId);
      expect(rows).toHaveLength(1);
      expect(rows[0].is_active).toBe(true);
    });

    it("answers 404 when removing a watch the user does not have", async () => {
      const { productId, marketId } = await productWithOffer();
      const response = await app.inject({
        method: "DELETE",
        url: `/api/v1/products/${productId}/watch?market_id=${marketId}`,
        headers: tmaHeaders(newTelegramId()),
      });
      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe("RESOURCE_NOT_FOUND");
    });
  });

  // ------------------------------------------------------------------
  // Input validation
  // ------------------------------------------------------------------
  describe("input validation", () => {
    it("validates product and market ids", async () => {
      const { productId, marketId } = await productWithOffer();
      const telegramId = newTelegramId();

      const badProduct = await app.inject({
        method: "POST",
        url: "/api/v1/products/not-a-uuid/watch",
        headers: tmaHeaders(telegramId),
        payload: { market_id: marketId },
      });
      expect(badProduct.statusCode).toBe(400);

      const unknownProduct = await watch(telegramId, ZERO_UUID, { market_id: marketId });
      expect(unknownProduct.statusCode).toBe(404);

      for (const market_id of ["not-a-uuid", "", 123, null]) {
        const response = await watch(telegramId, productId, { market_id });
        expect(response.statusCode, String(market_id)).toBe(400);
      }
      const missingMarket = await watch(telegramId, productId, {});
      expect(missingMarket.statusCode).toBe(400);

      const unknownMarket = await watch(telegramId, productId, { market_id: ZERO_UUID });
      expect(unknownMarket.statusCode).toBe(400);
      expect(await watchRows(productId)).toHaveLength(0);
    });

    it("rejects a product that is not offered in the market", async () => {
      const marketId = await getSeededMarketId(app);
      const productWithoutOffers = await createProduct();
      const response = await watch(newTelegramId(), productWithoutOffers, { market_id: marketId });
      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");
      expect(await watchRows(productWithoutOffers)).toHaveLength(0);
    });

    it("rejects zero, negative, non-numeric and absurd target prices", async () => {
      const { productId, marketId } = await productWithOffer();
      const telegramId = newTelegramId();
      for (const target_price of [0, -1, -0.5, "99", true, [], {}, 0.001, 1e12]) {
        const response = await watch(telegramId, productId, { market_id: marketId, target_price });
        expect(response.statusCode, JSON.stringify(target_price)).toBe(400);
        expect(response.json().error.code).toBe("VALIDATION_ERROR");
      }
      expect(await watchRows(productId)).toHaveLength(0);
    });

    it("validates the remove and watchlist query parameters", async () => {
      const { productId, marketId } = await productWithOffer();
      const headers = tmaHeaders(newTelegramId());

      for (const url of [
        `/api/v1/products/${productId}/watch`,
        `/api/v1/products/${productId}/watch?market_id=not-a-uuid`,
        `/api/v1/products/not-a-uuid/watch?market_id=${marketId}`,
      ]) {
        const response = await app.inject({ method: "DELETE", url, headers });
        expect(response.statusCode, url).toBe(400);
      }

      const noMarket = await app.inject({ method: "GET", url: "/api/v1/users/me/watchlist", headers });
      expect(noMarket.statusCode).toBe(400);
      const badMarket = await app.inject({
        method: "GET",
        url: "/api/v1/users/me/watchlist?market_id=not-a-uuid",
        headers,
      });
      expect(badMarket.statusCode).toBe(400);
      const unknownMarket = await app.inject({
        method: "GET",
        url: `/api/v1/users/me/watchlist?market_id=${ZERO_UUID}`,
        headers,
      });
      expect(unknownMarket.statusCode).toBe(404);
    });
  });

  // ------------------------------------------------------------------
  // Authorization / user isolation
  // ------------------------------------------------------------------
  describe("user isolation", () => {
    it("keeps users' watches, watchlists and targets separate", async () => {
      const { productId, marketId } = await productWithOffer();
      const other = await productWithOffer();
      const userA = newTelegramId();
      const userB = newTelegramId();

      await watch(userA, productId, { market_id: marketId, target_price: 90 });
      await watch(userA, other.productId, { market_id: marketId, target_price: 50 });
      await watch(userB, productId, { market_id: marketId, target_price: 70 });

      // User B only ever sees their own watch.
      const listB = await app.inject({
        method: "GET",
        url: `/api/v1/users/me/watchlist?market_id=${marketId}`,
        headers: tmaHeaders(userB),
      });
      const itemsB = listB.json().data;
      expect(itemsB.some((item: any) => item.product.product_id === other.productId)).toBe(false);
      const mine = itemsB.filter((item: any) => item.product.product_id === productId);
      expect(mine).toHaveLength(1);
      expect(mine[0].target_price).toBe(70);

      // User B cannot remove user A's watch (they have none for that product).
      const removeOthers = await app.inject({
        method: "DELETE",
        url: `/api/v1/products/${other.productId}/watch?market_id=${marketId}`,
        headers: tmaHeaders(userB),
      });
      expect(removeOthers.statusCode).toBe(404);
      const otherRows = await watchRows(other.productId);
      expect(otherRows).toHaveLength(1);
      expect(otherRows[0].is_active).toBe(true);

      // User B changing their own watch never touches user A's.
      await watch(userB, productId, { market_id: marketId, target_price: 60 });
      const rows = await watchRows(productId);
      expect(rows).toHaveLength(2);
      expect(rows.map((row) => Number(row.target_price)).sort()).toEqual([60, 90]);

      // User B removing their own watch leaves user A's active.
      await app.inject({
        method: "DELETE",
        url: `/api/v1/products/${productId}/watch?market_id=${marketId}`,
        headers: tmaHeaders(userB),
      });
      const afterRemove = await watchRows(productId);
      expect(afterRemove.filter((row) => row.is_active)).toHaveLength(1);
      expect(Number(afterRemove.filter((row) => row.is_active)[0].target_price)).toBe(90);
    });

    it("ignores any user id the client puts in the request body or query", async () => {
      const { productId, marketId } = await productWithOffer();
      const userA = newTelegramId();
      const victim = newTelegramId();
      await watch(victim, productId, { market_id: marketId, target_price: 33 });

      // User A tries to act as the victim by supplying ids themselves.
      const response = await watch(userA, productId, {
        market_id: marketId,
        target_price: 44,
        user_id: randomUUID(),
        telegram_user_id: victim,
      });
      expect(response.statusCode).toBe(201);
      const rows = await watchRows(productId);
      expect(rows).toHaveLength(2);
      expect(rows.map((row) => Number(row.target_price)).sort()).toEqual([33, 44]);
    });
  });

  // ------------------------------------------------------------------
  // Watchlist retrieval
  // ------------------------------------------------------------------
  describe("watchlist", () => {
    it("returns the user's watched products with price, target and price status", async () => {
      const marketId = await getSeededMarketId(app);
      const telegramId = newTelegramId();

      // P1: current price 50 against a stored history of 60 -> LOW.
      const p1 = await createProduct({ image_url: "https://example.com/p1.png" });
      const m1 = await createMerchant();
      const o1 = await createOffer(p1, m1, marketId, 50);
      await insertHistory(p1, m1, marketId, o1, 60, 10);
      // P2: one offer, no history.
      const p2 = await createProduct();
      const m2 = await createMerchant();
      await createOffer(p2, m2, marketId, 100);

      await watch(telegramId, p1, { market_id: marketId, target_price: 55 });
      await watch(telegramId, p2, { market_id: marketId });

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/users/me/watchlist?market_id=${marketId}`,
        headers: tmaHeaders(telegramId),
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.meta.total).toBe(2);
      expect(body.data).toHaveLength(2);

      const item1 = body.data.find((item: any) => item.product.product_id === p1);
      expect(item1.product.name).toBe("Watchlist Product");
      expect(item1.product.image_url).toBe("https://example.com/p1.png");
      expect(item1.market_id).toBe(marketId);
      expect(item1.active).toBe(true);
      expect(item1.target_price).toBe(55);
      expect(item1.offer_count).toBe(1);
      expect(item1.lowest_shown_price.listed_price).toBe(50);
      expect(item1.lowest_shown_price.effective_price).toBe(50);
      expect(item1.lowest_shown_price.merchant.merchant_id).toBe(m1);
      expect(item1.lowest_shown_price.is_fixture).toBe(false);
      expect(item1.price_status.status).toBe("low");
      expect(item1.target_reached).toBe(true);

      const item2 = body.data.find((item: any) => item.product.product_id === p2);
      expect(item2.target_price).toBeNull();
      expect(item2.price_status.status).toBe("not_enough_data");
      expect(item2.target_reached).toBeNull();

      // Pagination.
      const page2 = await app.inject({
        method: "GET",
        url: `/api/v1/users/me/watchlist?market_id=${marketId}&limit=1&page=2`,
        headers: tmaHeaders(telegramId),
      });
      expect(page2.json().data).toHaveLength(1);
      expect(page2.json().meta).toMatchObject({ total: 2, limit: 1, page: 2 });
    });

    it("hides removed watches unless include_inactive=true, and marks them inactive", async () => {
      const { productId, marketId } = await productWithOffer();
      const telegramId = newTelegramId();
      await watch(telegramId, productId, { market_id: marketId });
      await app.inject({
        method: "DELETE",
        url: `/api/v1/products/${productId}/watch?market_id=${marketId}`,
        headers: tmaHeaders(telegramId),
      });

      const hidden = await app.inject({
        method: "GET",
        url: `/api/v1/users/me/watchlist?market_id=${marketId}`,
        headers: tmaHeaders(telegramId),
      });
      expect(hidden.json().data).toHaveLength(0);

      const shown = await app.inject({
        method: "GET",
        url: `/api/v1/users/me/watchlist?market_id=${marketId}&include_inactive=true`,
        headers: tmaHeaders(telegramId),
      });
      expect(shown.json().data).toHaveLength(1);
      expect(shown.json().data[0].active).toBe(false);
    });

    it("flags sample (fixture) prices instead of presenting them as real", async () => {
      const marketId = await getSeededMarketId(app);
      const productId = await createProduct();
      await createOffer(productId, await createMerchant(), marketId, 80, { is_fixture: true });
      const telegramId = newTelegramId();
      await watch(telegramId, productId, { market_id: marketId, target_price: 90 });

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/users/me/watchlist?market_id=${marketId}`,
        headers: tmaHeaders(telegramId),
      });
      const item = response.json().data[0];
      expect(item.lowest_shown_price.is_fixture).toBe(true);
      expect(item.price_status.status).toBe("not_enough_data");
      // A sample price never counts as reaching the user's target.
      expect(item.target_reached).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // Watch status on the public product detail
  // ------------------------------------------------------------------
  describe("watch status on product detail", () => {
    it("adds the caller's own watch status; anonymous browsing is unchanged", async () => {
      const { productId, marketId } = await productWithOffer();
      const userA = newTelegramId();
      const userB = newTelegramId();
      await watch(userA, productId, { market_id: marketId, target_price: 90 });
      const url = `/api/v1/products/${productId}?market_id=${marketId}`;

      // Anonymous: normal public response, no watch information at all.
      const anonymous = await rawApp.inject({ method: "GET", url });
      expect(anonymous.statusCode).toBe(200);
      expect(anonymous.json().data.offers).toHaveLength(1);
      expect(anonymous.json().data.watch).toBeUndefined();

      // User A sees their own watch.
      const asA = await rawApp.inject({ method: "GET", url, headers: tmaHeaders(userA) });
      expect(asA.statusCode).toBe(200);
      expect(asA.json().data.watch).toEqual({
        is_watching: true,
        target_price: 90,
        watch_active: true,
      });
      expect(asA.json().data.offers).toHaveLength(1);

      // User B is not watching and learns nothing about user A's watch.
      const asB = await rawApp.inject({ method: "GET", url, headers: tmaHeaders(userB) });
      expect(asB.json().data.watch).toEqual({
        is_watching: false,
        target_price: null,
        watch_active: false,
      });

      // After removing, user A is no longer watching.
      await app.inject({
        method: "DELETE",
        url: `/api/v1/products/${productId}/watch?market_id=${marketId}`,
        headers: tmaHeaders(userA),
      });
      const afterRemove = await rawApp.inject({ method: "GET", url, headers: tmaHeaders(userA) });
      expect(afterRemove.json().data.watch.is_watching).toBe(false);
      expect(afterRemove.json().data.watch.watch_active).toBe(false);
    });

    it("still serves public product browsing with a stale or invalid credential", async () => {
      const { productId, marketId } = await productWithOffer();
      const url = `/api/v1/products/${productId}?market_id=${marketId}`;
      const staleHeaders = {
        authorization: `tma ${buildInitData({ authDate: Math.floor(Date.now() / 1000) - 5 * 86400 })}`,
      };
      for (const headers of [staleHeaders, { authorization: "tma garbage" }]) {
        const response = await rawApp.inject({ method: "GET", url, headers });
        expect(response.statusCode).toBe(200);
        expect(response.json().data.watch).toBeUndefined();
      }
    });

    it("leaves the plain product response and public search untouched", async () => {
      const { productId } = await productWithOffer();
      const plain = await rawApp.inject({
        method: "GET",
        url: `/api/v1/products/${productId}`,
        headers: tmaHeaders(newTelegramId()),
      });
      expect(plain.statusCode).toBe(200);
      expect(plain.json().data.product_id).toBe(productId);
      expect(plain.json().data.watch).toBeUndefined();
      expect(plain.json().data.offers).toBeUndefined();

      const search = await rawApp.inject({ method: "GET", url: "/api/v1/products/search" });
      expect(search.statusCode).toBe(400); // reaches the handler: public, just needs q + market_id
    });
  });
});
