import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool, getPool } from "../../src/config/database.js";
import { getSeededMarketId, uniqueSlug } from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const hasAmazonFixtureConfig =
  process.env.AMAZON_AFFILIATE_ENABLED === "true" && Boolean(process.env.AMAZON_AFFILIATE_TAG);

describe.skipIf(!hasDatabase)("Affiliate Redirect API", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  async function createDealWithOffer(programStatus: "active" | "pending" | "none"): Promise<{
    dealId: string;
    offerUrl: string;
  }> {
    const marketId = await getSeededMarketId(app);

    const merchant = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Redirect Test Merchant", slug: uniqueSlug("redirect-merchant") },
    });
    const merchantId = merchant.json().data.merchant_id;

    if (programStatus !== "none") {
      const pool = getPool();
      await pool.query(
        `INSERT INTO affiliate_programs (merchant_id, network_name, program_name, status)
         VALUES ($1, 'amazon_associates', 'Amazon Associates (test)', $2)`,
        [merchantId, programStatus],
      );
    }

    const product = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "Redirect Test Product", slug: uniqueSlug("redirect-product") },
    });
    const productId = product.json().data.product_id;

    const offerUrl = `https://example.com/product/${randomUUID()}`;
    const offer = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: merchantId,
        market_id: marketId,
        offer_url: offerUrl,
        price: 42,
        currency: "USD",
      },
    });
    const offerId = offer.json().data.offer_id;

    const deal = await app.inject({
      method: "POST",
      url: "/api/v1/deals",
      payload: {
        merchant_id: merchantId,
        market_id: marketId,
        title: "Redirect Test Deal",
        slug: uniqueSlug("redirect-deal"),
        currency: "USD",
        offer_id: offerId,
      },
    });

    return { dealId: deal.json().data.deal_id, offerUrl };
  }

  it.skipIf(!hasAmazonFixtureConfig)(
    "redirects to the affiliate URL and records a click when affiliate is available",
    async () => {
      const { dealId } = await createDealWithOffer("active");

      const response = await app.inject({ method: "GET", url: `/api/v1/redirect/deal/${dealId}` });
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain("tag=");

      const pool = getPool();
      const { rows } = await pool.query(
        "SELECT * FROM click_events WHERE deal_id = $1",
        [dealId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].channel).toBe("web");
    },
  );

  it("falls back to the plain merchant URL when no affiliate program exists", async () => {
    const { dealId, offerUrl } = await createDealWithOffer("none");

    const response = await app.inject({ method: "GET", url: `/api/v1/redirect/deal/${dealId}` });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(offerUrl);

    const pool = getPool();
    const { rows } = await pool.query("SELECT * FROM click_events WHERE deal_id = $1", [dealId]);
    expect(rows).toHaveLength(1);
    expect(rows[0].affiliate_link_id).toBeNull();
  });

  it("falls back to the plain merchant URL when the affiliate program is pending (not active)", async () => {
    const { dealId, offerUrl } = await createDealWithOffer("pending");

    const response = await app.inject({ method: "GET", url: `/api/v1/redirect/deal/${dealId}` });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(offerUrl);
  });

  it("returns 404 for a non-existent deal", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/redirect/deal/00000000-0000-0000-0000-000000000000",
    });
    expect(response.statusCode).toBe(404);
  });

  it("returns 400 for an invalid deal id (not a UUID) rather than redirecting anywhere", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/redirect/deal/not-a-uuid" });
    expect(response.statusCode).toBe(400);
    expect(response.headers.location).toBeUndefined();
  });

  it("returns 400 for a deal with no associated offer (safe error, no redirect)", async () => {
    const marketId = await getSeededMarketId(app);
    const merchant = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "No Offer Deal Merchant", slug: uniqueSlug("no-offer-merchant") },
    });
    const deal = await app.inject({
      method: "POST",
      url: "/api/v1/deals",
      payload: {
        merchant_id: merchant.json().data.merchant_id,
        market_id: marketId,
        title: "No Offer Deal",
        slug: uniqueSlug("no-offer-deal"),
        currency: "USD",
      },
    });

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/redirect/deal/${deal.json().data.deal_id}`,
    });
    expect(response.statusCode).toBe(400);
    expect(response.headers.location).toBeUndefined();
  });
});
