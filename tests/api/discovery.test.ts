import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../../src/config/database.js";
import type { ImageIdentificationProvider } from "../../src/discovery/image-identification.js";
import { MAX_IMAGE_BYTES } from "../../src/discovery/image-identification.js";
import { TEST_BOT_TOKEN, tmaHeaders } from "../helpers/telegram-init-data.js";
import {
  buildAuthedServer,
  getSeededMarketId,
  internalAuthHeaders,
  uniqueSlug,
} from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32),
]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);

let telegramIdCounter = 0;
function newTelegramId(): number {
  telegramIdCounter += 1;
  return 900_000_000 + Math.floor(Math.random() * 1_000_000_000) + telegramIdCounter;
}

/** A valid EAN-13 that starts with 0, so its last 12 digits are the same barcode as a UPC-A. */
function randomBarcode(): { ean13: string; upc: string; gtin14: string } {
  const body = "0" + Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join("");
  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += Number(body[index]) * (index % 2 === 0 ? 1 : 3);
  }
  const ean13 = body + String((10 - (sum % 10)) % 10);
  return { ean13, upc: ean13.slice(1), gtin14: ean13.padStart(14, "0") };
}

describe.skipIf(!hasDatabase)("Unified discovery: barcode and image converge on the product comparison", () => {
  const app = buildAuthedServer({ telegramBotToken: TEST_BOT_TOKEN });

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  async function createMerchant(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: "Discovery Merchant", slug: uniqueSlug("discovery-merchant") },
    });
    return response.json().data.merchant_id;
  }

  async function createProduct(): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "Discovery Product", slug: uniqueSlug("discovery-product") },
    });
    return response.json().data.product_id;
  }

  async function createOffer(
    productId: string,
    price: number,
    extra: Record<string, unknown> = {},
  ): Promise<string> {
    const marketId = await getSeededMarketId(app);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: await createMerchant(),
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

  async function mapBarcode(productId: string, gtin: string): Promise<void> {
    await getPool().query("INSERT INTO product_barcodes (product_id, gtin) VALUES ($1, $2)", [
      productId,
      gtin,
    ]);
  }

  /** A product with two offers, mapped to a fresh barcode. */
  async function mappedProduct() {
    const marketId = await getSeededMarketId(app);
    const productId = await createProduct();
    await createOffer(productId, 99.99);
    const cheapest = await createOffer(productId, 94.99);
    const barcode = randomBarcode();
    await mapBarcode(productId, barcode.gtin14);
    return { marketId, productId, cheapest, barcode };
  }

  // ------------------------------------------------------------------
  // Barcode
  // ------------------------------------------------------------------
  describe("barcode", () => {
    it("resolves a barcode to the canonical product and the SAME comparison as the product page", async () => {
      const { marketId, productId, cheapest, barcode } = await mappedProduct();

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/products/search/barcode?code=${barcode.ean13}&market_id=${marketId}`,
      });
      expect(response.statusCode).toBe(200);
      const data = response.json().data;
      expect(data.discovery).toEqual({
        method: "barcode",
        canonical_product_id: productId,
        barcode: barcode.gtin14,
      });
      expect(data.comparison.product_id).toBe(productId);
      expect(data.comparison.best_offer_id).toBe(cheapest);
      expect(data.comparison.offers.map((o: { listed_price: number }) => o.listed_price)).toEqual([94.99, 99.99]);

      // Identical to what the product detail endpoint returns for that product.
      const detail = await app.inject({
        method: "GET",
        url: `/api/v1/products/${productId}?market_id=${marketId}`,
      });
      expect(data.comparison).toEqual(detail.json().data);
    });

    it("treats the UPC-A and EAN-13 forms of one barcode as the same product", async () => {
      const { marketId, productId, barcode } = await mappedProduct();
      for (const code of [barcode.upc, barcode.ean13, barcode.gtin14]) {
        const response = await app.inject({
          method: "GET",
          url: `/api/v1/products/search/barcode?code=${code}&market_id=${marketId}`,
        });
        expect(response.statusCode, code).toBe(200);
        expect(response.json().data.discovery.canonical_product_id).toBe(productId);
      }
    });

    it("rejects invalid barcodes with a validation error", async () => {
      const marketId = await getSeededMarketId(app);
      for (const code of ["", "abc", "12345", "0".repeat(40), "036000291453", "1' OR '1'='1"]) {
        const response = await app.inject({
          method: "GET",
          url: `/api/v1/products/search/barcode?code=${encodeURIComponent(code)}&market_id=${marketId}`,
        });
        expect(response.statusCode, code).toBe(400);
        expect(response.json().error.code).toBe("VALIDATION_ERROR");
      }
      const missing = await app.inject({
        method: "GET",
        url: `/api/v1/products/search/barcode?market_id=${marketId}`,
      });
      expect(missing.statusCode).toBe(400);
      const repeated = await app.inject({
        method: "GET",
        url: `/api/v1/products/search/barcode?code=036000291452&code=036000291452&market_id=${marketId}`,
      });
      expect(repeated.statusCode).toBe(400);
    });

    it("answers 'product not found' for a valid barcode nobody has mapped - and invents nothing", async () => {
      const marketId = await getSeededMarketId(app);
      const response = await app.inject({
        method: "GET",
        url: `/api/v1/products/search/barcode?code=${randomBarcode().ean13}&market_id=${marketId}`,
      });
      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Product not found for this barcode" },
      });
    });

    it("does not resolve a barcode of an inactive product", async () => {
      const { marketId, productId, barcode } = await mappedProduct();
      await app.inject({ method: "DELETE", url: `/api/v1/products/${productId}` });
      const response = await app.inject({
        method: "GET",
        url: `/api/v1/products/search/barcode?code=${barcode.ean13}&market_id=${marketId}`,
      });
      expect(response.statusCode).toBe(404);
    });

    it("keeps the market: another market has no offers, an unknown market is unavailable", async () => {
      const { productId, barcode } = await mappedProduct();
      const other = await getPool().query(
        `INSERT INTO markets (code, name, currency, language, timezone)
         VALUES ($1, 'Barcode Isolation Test', 'EUR', 'en', 'UTC')
         RETURNING market_id`,
        [uniqueSlug("XX").slice(0, 8).toUpperCase()],
      );
      const otherResponse = await app.inject({
        method: "GET",
        url: `/api/v1/products/search/barcode?code=${barcode.ean13}&market_id=${other.rows[0].market_id}`,
      });
      expect(otherResponse.statusCode).toBe(200);
      expect(otherResponse.json().data.discovery.canonical_product_id).toBe(productId);
      expect(otherResponse.json().data.comparison.offer_count).toBe(0);
      expect(otherResponse.json().data.comparison.offers).toEqual([]);

      const unknown = await app.inject({
        method: "GET",
        url: `/api/v1/products/search/barcode?code=${barcode.ean13}&market_id=${ZERO_UUID}`,
      });
      expect(unknown.statusCode).toBe(404);

      const badMarket = await app.inject({
        method: "GET",
        url: `/api/v1/products/search/barcode?code=${barcode.ean13}&market_id=not-a-uuid`,
      });
      expect(badMarket.statusCode).toBe(400);
    });

    it("is public: no credentials needed to look up a barcode", async () => {
      const { marketId, barcode } = await mappedProduct();
      // buildAuthedServer adds the internal key by default; use a bare request instead.
      const bare = buildAuthedServer({ telegramBotToken: TEST_BOT_TOKEN });
      const response = await bare.inject({
        method: "GET",
        url: `/api/v1/products/search/barcode?code=${barcode.ean13}&market_id=${marketId}`,
        headers: { authorization: "" },
      });
      await bare.close();
      expect(response.statusCode).toBe(200);
    });
  });

  // ------------------------------------------------------------------
  // Image
  // ------------------------------------------------------------------
  describe("image search", () => {
    // A test-only stand-in for a future recognition provider. It is NOT
    // recognition: it returns whatever product id the test gives it.
    function standIn(productId: string | null): ImageIdentificationProvider {
      return {
        name: "test-stand-in",
        identify: async () => (productId ? { productId } : null),
      };
    }

    function upload(
      server: ReturnType<typeof buildAuthedServer>,
      marketId: string,
      body: Buffer,
      contentType: string,
      headers: Record<string, string> = tmaHeaders(newTelegramId()),
    ) {
      return server.inject({
        method: "POST",
        url: `/api/v1/products/search/image?market_id=${marketId}`,
        headers: { ...headers, "content-type": contentType },
        payload: body,
      });
    }

    it("answers 'image identification unavailable' when no provider is configured - no fake identification", async () => {
      const marketId = await getSeededMarketId(app);
      const response = await upload(app, marketId, PNG, "image/png");
      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        success: false,
        error: {
          code: "IMAGE_IDENTIFICATION_UNAVAILABLE",
          message: "Image identification is not available right now",
        },
      });
      expect(response.body).not.toContain("product_id");
      expect(response.body).not.toContain("comparison");
    });

    it("sends an identified product through the SAME comparison pipeline", async () => {
      const { marketId, productId } = await mappedProduct();
      const server = buildAuthedServer({
        telegramBotToken: TEST_BOT_TOKEN,
        imageIdentificationProvider: standIn(productId),
      });
      const response = await upload(server, marketId, JPEG, "image/jpeg");
      const detail = await app.inject({
        method: "GET",
        url: `/api/v1/products/${productId}?market_id=${marketId}`,
      });
      await server.close();

      expect(response.statusCode).toBe(200);
      expect(response.json().data.discovery).toEqual({
        method: "image",
        canonical_product_id: productId,
      });
      expect(response.json().data.comparison).toEqual(detail.json().data);
    });

    it("reports 'not found' when the provider recognises nothing or returns an unknown product", async () => {
      const marketId = await getSeededMarketId(app);
      for (const provider of [standIn(null), standIn(ZERO_UUID), standIn("not-a-uuid")]) {
        const server = buildAuthedServer({
          telegramBotToken: TEST_BOT_TOKEN,
          imageIdentificationProvider: provider,
        });
        const response = await upload(server, marketId, PNG, "image/png");
        await server.close();
        expect(response.statusCode).toBe(404);
        expect(response.json().error.code).toBe("RESOURCE_NOT_FOUND");
      }
    });

    it("reports unavailable (without leaking details) when the provider fails", async () => {
      const marketId = await getSeededMarketId(app);
      const server = buildAuthedServer({
        telegramBotToken: TEST_BOT_TOKEN,
        imageIdentificationProvider: {
          name: "broken",
          identify: async () => {
            throw new Error("secret provider failure: api-key-123");
          },
        },
      });
      const response = await upload(server, marketId, PNG, "image/png");
      await server.close();
      expect(response.statusCode).toBe(503);
      expect(response.body).not.toContain("api-key-123");
    });

    it("rejects unsupported media types (415) before anything else", async () => {
      const marketId = await getSeededMarketId(app);
      for (const type of ["image/gif", "text/plain", "image/svg+xml"]) {
        const response = await upload(app, marketId, Buffer.from("data"), type);
        expect(response.statusCode, type).toBe(415);
        expect(response.json().error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
      }
    });

    it("rejects a body that is not an image, or whose bytes do not match the declared type (400)", async () => {
      const marketId = await getSeededMarketId(app);
      const jsonBody = await app.inject({
        method: "POST",
        url: `/api/v1/products/search/image?market_id=${marketId}`,
        headers: tmaHeaders(newTelegramId()),
        payload: { not: "an image" },
      });
      expect(jsonBody.statusCode).toBe(415);

      const mismatch = await upload(app, marketId, JPEG, "image/png");
      expect(mismatch.statusCode).toBe(400);
      const text = await upload(app, marketId, Buffer.from("<svg onload=alert(1)>"), "image/png");
      expect(text.statusCode).toBe(400);
      const empty = await upload(app, marketId, Buffer.alloc(0), "image/png");
      expect(empty.statusCode).toBe(400);
    });

    it("rejects an oversized image (413)", async () => {
      const marketId = await getSeededMarketId(app);
      const big = Buffer.concat([PNG, Buffer.alloc(MAX_IMAGE_BYTES)]);
      const response = await upload(app, marketId, big, "image/png");
      expect(response.statusCode).toBe(413);
      expect(response.json().error.code).toBe("PAYLOAD_TOO_LARGE");
    });

    it("requires a verified Telegram user and a valid market", async () => {
      const marketId = await getSeededMarketId(app);
      // No user credential at all (an empty header replaces the default internal key).
      const anonymous = await upload(app, marketId, PNG, "image/png", { authorization: "" });
      expect(anonymous.statusCode).toBe(401);
      // The internal API key is not a user credential.
      const internal = await upload(app, marketId, PNG, "image/png", internalAuthHeaders());
      expect(internal.statusCode).toBe(401);

      const noMarket = await app.inject({
        method: "POST",
        url: "/api/v1/products/search/image",
        headers: { ...tmaHeaders(newTelegramId()), "content-type": "image/png" },
        payload: PNG,
      });
      expect(noMarket.statusCode).toBe(400);
    });
  });
});
