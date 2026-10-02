import { getPool } from "../config/database.js";
import { escapeLikePattern } from "./search-query.js";

/**
 * Product search (Phase 1). Searches the canonical products table and
 * joins each match to its best (lowest-priced) ACTIVE offer in one
 * market. Merchant-agnostic: nothing here knows about Amazon or any
 * specific store. Products with no active offer in the requested
 * market are not returned, so results are always buyable in that
 * market and prices are never mixed across markets/currencies.
 *
 * All user input is passed as bound parameters.
 */

export interface ProductSearchRow {
  product_id: string;
  name: string;
  slug: string;
  brand: string | null;
  image_url: string | null;
  category_id: string | null;
  offer_count: number;
  best_offer_id: string;
  best_merchant_id: string;
  best_merchant_name: string;
  best_merchant_slug: string;
  best_price: string;
  best_original_price: string | null;
  best_currency: string;
  best_availability_status: string;
  best_is_fixture: boolean;
}

export interface ProductSearchParams {
  terms: string[];
  /** The full query, used only for relevance ordering. */
  phrase: string;
  marketId: string;
  categoryId?: string;
}

export async function searchProducts(
  params: ProductSearchParams,
  limit: number,
  offset: number,
): Promise<{ rows: ProductSearchRow[]; total: number }> {
  const pool = getPool();
  const values: unknown[] = [params.marketId];
  const conditions: string[] = ["p.status = 'active'"];

  for (const term of params.terms) {
    values.push(`%${escapeLikePattern(term)}%`);
    const n = values.length;
    conditions.push(
      `(p.name ILIKE $${n} OR p.brand ILIKE $${n} OR p.slug ILIKE $${n} OR p.description ILIKE $${n})`,
    );
  }
  if (params.categoryId) {
    values.push(params.categoryId);
    conditions.push(`p.category_id = $${values.length}`);
  }
  conditions.push(
    `EXISTS (SELECT 1 FROM offers o0 WHERE o0.product_id = p.product_id AND o0.market_id = $1 AND o0.status = 'active')`,
  );
  const where = conditions.join(" AND ");

  const countQuery = `SELECT COUNT(*)::text AS count FROM products p WHERE ${where}`;

  const phraseLower = params.phrase.toLowerCase();
  const escapedPhrase = escapeLikePattern(phraseLower);
  const dataValues: unknown[] = [...values];
  dataValues.push(phraseLower);
  const exactIdx = dataValues.length;
  dataValues.push(`${escapedPhrase}%`);
  const prefixIdx = dataValues.length;
  dataValues.push(`%${escapedPhrase}%`);
  const containsIdx = dataValues.length;
  dataValues.push(limit);
  const limitIdx = dataValues.length;
  dataValues.push(offset);
  const offsetIdx = dataValues.length;

  const dataQuery = `
    SELECT
      p.product_id, p.name, p.slug, p.brand, p.image_url, p.category_id,
      oc.offer_count,
      best.offer_id AS best_offer_id,
      best.merchant_id AS best_merchant_id,
      best.merchant_name AS best_merchant_name,
      best.merchant_slug AS best_merchant_slug,
      best.price AS best_price,
      best.original_price AS best_original_price,
      best.currency AS best_currency,
      best.availability_status AS best_availability_status,
      best.is_fixture AS best_is_fixture
    FROM products p
    JOIN LATERAL (
      SELECT o.offer_id, o.merchant_id, m.name AS merchant_name, m.slug AS merchant_slug,
             o.price, o.original_price, o.currency, o.availability_status, o.is_fixture
      FROM offers o
      JOIN merchants m ON m.merchant_id = o.merchant_id
      WHERE o.product_id = p.product_id AND o.market_id = $1 AND o.status = 'active'
      ORDER BY o.price ASC, o.offer_id ASC
      LIMIT 1
    ) best ON TRUE
    JOIN LATERAL (
      SELECT COUNT(*)::int AS offer_count
      FROM offers o2
      WHERE o2.product_id = p.product_id AND o2.market_id = $1 AND o2.status = 'active'
    ) oc ON TRUE
    WHERE ${where}
    ORDER BY
      CASE
        WHEN lower(p.name) = $${exactIdx} THEN 0
        WHEN p.name ILIKE $${prefixIdx} THEN 1
        WHEN p.name ILIKE $${containsIdx} THEN 2
        ELSE 3
      END,
      best.price ASC,
      p.name ASC,
      p.product_id ASC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}`;

  const [dataResult, countResult] = await Promise.all([
    pool.query<ProductSearchRow>(dataQuery, dataValues),
    pool.query<{ count: string }>(countQuery, values),
  ]);

  return {
    rows: dataResult.rows,
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}
