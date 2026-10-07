import { getPool } from "../config/database.js";
import { escapeLikePattern } from "./search-query.js";

/**
 * Product text search (the discovery entry point). Finds canonical
 * products only; offers, pricing and intelligence for the matches come
 * from the shared offer/price modules in product-search.service.ts, so
 * there is a single pricing path. Only products with at least one ACTIVE
 * offer in the requested market are returned, so every result is
 * comparable in that market and markets/currencies are never mixed.
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
    SELECT p.product_id, p.name, p.slug, p.brand, p.image_url, p.category_id
    FROM products p
    WHERE ${where}
    ORDER BY
      CASE
        WHEN lower(p.name) = $${exactIdx} THEN 0
        WHEN p.name ILIKE $${prefixIdx} THEN 1
        WHEN p.name ILIKE $${containsIdx} THEN 2
        ELSE 3
      END,
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
