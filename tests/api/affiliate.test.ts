import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool, getPool } from "../../src/config/database.js";
import { getSeededMarketId, uniqueSlug } from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
// Only set in CI (see .github/workflows/ci.yml) with a fixture value -
// not a real Amazon Associates tag. Gates the one test that needs the
// affiliate provider to actually be "configured".
const hasAmazonFixtureConfig =
  process.env.AMAZON_AFFILIATE_ENABLED === "true" && Boolean(process.env.AMAZON_AFFILIATE_TAG);

describe.skipIf(!hasDatabase)("Affiliate Links API", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  async function createMerchantWithProgram(status: "active" | "pending"): Promise<{
    merchantId: string;
    offerId: string;
  }> {
    const merchant = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Affiliate Test Merchant", slug: uniqueSlug("affiliate-merchant") },
    });
    const merchantId = merchant.json().data.merchant_id;

    const pool = getPool();
    await pool.query(
      `INSERT INTO affiliate_programs (merchant_id, network_name, program_name, status)
       VALUES ($1, 'amazon_associates', 'Amazon Associates (test)', $2)`,
      [merchantId, status],
    );

    const product = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "Affiliate Test Product", slug: uniqueSlug("affiliate-product") },
    });
    const productId = product.json().data.product_id;
    const marketId = await getSeededMarketId(app);

    const offer = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: merchantId,
        market_id: marketId,
        offer_url: `https://example.com/product/${randomUUID()}`,
        price: 15,
        currency: "USD",
      },
    });

    return { merchantId, offerId: offer.json().data.offer_id };
  }

  it.skipIf(!hasAmazonFixtureConfig)(
    "generates an affiliate link when the provider is configured and the program is active",
    async () => {
      const { offerId } = await createMerchantWithProgram("active");

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/affiliate-links",
        payload: { offer_id: offerId },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.affiliate_url).toContain("tag=");
      expect(body.data.status).toBe("active");
    },
  );

  it.skipIf(!hasAmazonFixtureConfig)(
    "reuses an existing affiliate link for the same offer instead of duplicating it",
    async () => {
      const { offerId } = await createMerchantWithProgram("active");

      const first = await app.inject({
        method: "POST",
        url: "/api/v1/affiliate-links",
        payload: { offer_id: offerId },
      });
      expect(first.statusCode).toBe(201);

      const second = await app.inject({
        method: "POST",
        url: "/api/v1/affiliate-links",
        payload: { offer_id: offerId },
      });
      expect(second.statusCode).toBe(200);
      expect(second.json().data.affiliate_link_id).toBe(first.json().data.affiliate_link_id);
    },
  );

  it("returns 400 when the merchant has no affiliate program configured (missing configuration)", async () => {
    const merchant = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "No Program Merchant", slug: uniqueSlug("no-program-merchant") },
    });
    const merchantId = merchant.json().data.merchant_id;

    const product = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "No Program Product", slug: uniqueSlug("no-program-product") },
    });
    const productId = product.json().data.product_id;
    const marketId = await getSeededMarketId(app);

    const offer = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: merchantId,
        market_id: marketId,
        offer_url: `https://example.com/product/${randomUUID()}`,
        price: 20,
        currency: "USD",
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/affiliate-links",
      payload: { offer_id: offer.json().data.offer_id },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for an unavailable (pending) affiliate program", async () => {
    const { offerId } = await createMerchantWithProgram("pending");

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/affiliate-links",
      payload: { offer_id: offerId },
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns 404 for a non-existent offer", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/affiliate-links",
      payload: { offer_id: "00000000-0000-0000-0000-000000000000" },
    });
    expect(response.statusCode).toBe(404);
  });

  it("returns 404 for a non-existent affiliate link id", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/affiliate-links/00000000-0000-0000-0000-000000000000",
    });
    expect(response.statusCode).toBe(404);
  });
});
