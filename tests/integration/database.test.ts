import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../../src/config/database.js";

/**
 * Real PostgreSQL integration tests for the Stage 1B schema.
 *
 * These run against a genuine database via DATABASE_URL - never
 * mocked - per the Stage 1B task ("Do NOT replace database tests with
 * fake assertions that never touch PostgreSQL"). They require an
 * actual PostgreSQL instance with the Stage 1B migrations already
 * applied (see database/migrations/ and scripts/db-migrate.ts).
 *
 * If DATABASE_URL isn't set (e.g. running `npm test` locally without
 * a database configured), this whole suite is skipped rather than
 * failing - CI is expected to provide a real PostgreSQL service and
 * DATABASE_URL so these actually execute there.
 */
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("database schema (Stage 1B)", () => {
  const pool = hasDatabase ? getPool() : null;

  afterAll(async () => {
    await closePool();
  });

  describe("seed data", () => {
    it("has the seeded USA market", async () => {
      const { rows } = await pool!.query(
        "SELECT code, name, currency, status FROM markets WHERE code = $1",
        ["US"],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        code: "US",
        currency: "USD",
        status: "active",
      });
    });

    it("has the seeded Amazon merchant", async () => {
      const { rows } = await pool!.query(
        "SELECT slug, merchant_status FROM merchants WHERE slug = $1",
        ["amazon"],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        slug: "amazon",
        merchant_status: "active",
      });
    });

    it("has a starter category set", async () => {
      const { rows } = await pool!.query(
        "SELECT slug FROM categories WHERE slug = $1",
        ["electronics"],
      );
      expect(rows).toHaveLength(1);
    });

    it("has the Amazon Associates affiliate program placeholder, with no credentials stored", async () => {
      const { rows } = await pool!.query(
        `SELECT ap.network_name, ap.status, ap.commission_value
         FROM affiliate_programs ap
         JOIN merchants m ON m.merchant_id = ap.merchant_id
         WHERE m.slug = $1 AND ap.network_name = $2`,
        ["amazon", "amazon_associates"],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].status).toBe("pending");
      // No commission has been configured yet - this is a structural
      // placeholder, not a real (or fake) commission rate.
      expect(rows[0].commission_value).toBeNull();
    });
  });

  describe("relationships and constraints", () => {
    it("allows the same product to have offers from multiple merchants", async () => {
      const marketId = await getSeededMarketId(pool!);
      const merchantAId = await createMerchant(pool!, "Test Merchant A");
      const merchantBId = await createMerchant(pool!, "Test Merchant B");
      const productId = await createProduct(pool!, "Test Product");

      await pool!.query(
        `INSERT INTO offers (product_id, merchant_id, market_id, offer_url, price, currency)
         VALUES ($1, $2, $3, 'https://example.com/a', 19.99, 'USD')`,
        [productId, merchantAId, marketId],
      );
      await pool!.query(
        `INSERT INTO offers (product_id, merchant_id, market_id, offer_url, price, currency)
         VALUES ($1, $2, $3, 'https://example.com/b', 21.5, 'USD')`,
        [productId, merchantBId, marketId],
      );

      const { rows } = await pool!.query(
        "SELECT merchant_id FROM offers WHERE product_id = $1",
        [productId],
      );
      expect(rows).toHaveLength(2);
    });

    it("rejects a duplicate offer for the same product/merchant/market", async () => {
      const marketId = await getSeededMarketId(pool!);
      const merchantId = await createMerchant(pool!, "Test Merchant Dup");
      const productId = await createProduct(pool!, "Test Product Dup");

      await pool!.query(
        `INSERT INTO offers (product_id, merchant_id, market_id, offer_url, price, currency)
         VALUES ($1, $2, $3, 'https://example.com', 10, 'USD')`,
        [productId, merchantId, marketId],
      );

      await expect(
        pool!.query(
          `INSERT INTO offers (product_id, merchant_id, market_id, offer_url, price, currency)
           VALUES ($1, $2, $3, 'https://example.com/again', 12, 'USD')`,
          [productId, merchantId, marketId],
        ),
      ).rejects.toThrow();
    });

    it("rejects an offer referencing a non-existent merchant (foreign key)", async () => {
      const marketId = await getSeededMarketId(pool!);
      const productId = await createProduct(pool!, "Test Product FK");

      await expect(
        pool!.query(
          `INSERT INTO offers (product_id, merchant_id, market_id, offer_url, price, currency)
           VALUES ($1, $2, $3, 'https://example.com', 10, 'USD')`,
          [productId, randomUUID(), marketId],
        ),
      ).rejects.toThrow();
    });

    it("rejects a duplicate market code (unique constraint)", async () => {
      await pool!.query(
        `INSERT INTO markets (code, name, currency, language, timezone)
         VALUES ($1, 'Duplicate Test', 'USD', 'en', 'UTC')`,
        ["ZZ"],
      );

      await expect(
        pool!.query(
          `INSERT INTO markets (code, name, currency, language, timezone)
           VALUES ($1, 'Duplicate Test 2', 'USD', 'en', 'UTC')`,
          ["ZZ"],
        ),
      ).rejects.toThrow();
    });
  });
});

async function getSeededMarketId(
  pool: NonNullable<ReturnType<typeof getPool>>,
): Promise<string> {
  const { rows } = await pool.query(
    "SELECT market_id FROM markets WHERE code = $1",
    ["US"],
  );
  return rows[0].market_id as string;
}

async function createMerchant(
  pool: NonNullable<ReturnType<typeof getPool>>,
  name: string,
): Promise<string> {
  const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${randomUUID().slice(0, 8)}`;
  const { rows } = await pool.query(
    "INSERT INTO merchants (name, slug) VALUES ($1, $2) RETURNING merchant_id",
    [name, slug],
  );
  return rows[0].merchant_id as string;
}

async function createProduct(
  pool: NonNullable<ReturnType<typeof getPool>>,
  name: string,
): Promise<string> {
  const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${randomUUID().slice(0, 8)}`;
  const { rows } = await pool.query(
    "INSERT INTO products (name, slug) VALUES ($1, $2) RETURNING product_id",
    [name, slug],
  );
  return rows[0].product_id as string;
}
