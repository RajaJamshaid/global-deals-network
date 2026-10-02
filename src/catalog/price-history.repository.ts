import { getPool } from "../config/database.js";

/**
 * Read access to product_price_history (append-only). Observations are
 * WRITTEN by the database trigger in migration 015 whenever an offer's
 * price changes, so there is deliberately no insert function here.
 *
 * Fixture observations (is_fixture = TRUE) are excluded unless the
 * caller explicitly asks for them.
 */

export interface PriceHistoryRow {
  history_id: string;
  product_id: string;
  merchant_id: string;
  market_id: string;
  offer_id: string | null;
  price: string;
  currency: string;
  source: string;
  is_fixture: boolean;
  observed_at: Date;
}

export interface PriceHistoryQuery {
  productId: string;
  marketId: string;
  days: number;
  merchantId?: string;
  includeFixtures: boolean;
}

/** Hard cap on rows returned for one product/market window. */
export const MAX_PRICE_HISTORY_ROWS = 2000;

export async function listPriceHistory(
  query: PriceHistoryQuery,
): Promise<PriceHistoryRow[]> {
  const pool = getPool();
  const values: unknown[] = [query.productId, query.marketId, query.days];
  const conditions: string[] = [
    "product_id = $1",
    "market_id = $2",
    "observed_at >= now() - make_interval(days => $3::int)",
  ];
  if (query.merchantId) {
    values.push(query.merchantId);
    conditions.push(`merchant_id = $${values.length}`);
  }
  if (!query.includeFixtures) {
    conditions.push("is_fixture = FALSE");
  }

  const { rows } = await pool.query<PriceHistoryRow>(
    `SELECT history_id, product_id, merchant_id, market_id, offer_id, price,
            currency, source, is_fixture, observed_at
     FROM product_price_history
     WHERE ${conditions.join(" AND ")}
     ORDER BY observed_at ASC, created_at ASC
     LIMIT ${MAX_PRICE_HISTORY_ROWS}`,
    values,
  );
  return rows;
}

export interface ProductObservationRow {
  product_id: string;
  merchant_id: string;
  price: string;
  is_fixture: boolean;
  observed_at: Date;
}

/** Batch read used by search to compute price status for a page of results. */
export async function listObservationsForProducts(
  marketId: string,
  productIds: string[],
  days: number,
  includeFixtures: boolean,
): Promise<ProductObservationRow[]> {
  if (productIds.length === 0) return [];
  const pool = getPool();
  const { rows } = await pool.query<ProductObservationRow>(
    `SELECT product_id, merchant_id, price, is_fixture, observed_at
     FROM product_price_history
     WHERE market_id = $1
       AND product_id = ANY($2::uuid[])
       AND observed_at >= now() - make_interval(days => $3::int)
       ${includeFixtures ? "" : "AND is_fixture = FALSE"}`,
    [marketId, productIds, days],
  );
  return rows;
}
