import { getPool } from "../config/database.js";

/**
 * Data access for user_product_watch (migration 014). The table is
 * unique on (user_id, product_id): a user has at most one watch row per
 * product, and that row carries the market the user is watching it in.
 * Every query is parameterized and scoped by user_id, so one user can
 * never read or change another user's watches.
 */

export interface WatchRow {
  watch_id: string;
  user_id: string;
  product_id: string;
  market_id: string | null;
  target_price: string | null;
  currency: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpsertWatchInput {
  userId: string;
  productId: string;
  marketId: string;
  currency: string;
  /**
   * undefined = leave an existing target as it is (on create: no target)
   * null      = clear the target
   * number    = set the target
   */
  targetPrice: number | null | undefined;
}

/**
 * Creates the watch, or updates the user's existing one (re-activating it
 * if it had been removed). A single INSERT .. ON CONFLICT, so concurrent
 * requests can never create a duplicate row.
 *
 * If the watch moves to a different market and no new target is given,
 * the old target is cleared: it was expressed in another currency.
 */
export async function upsertWatch(
  input: UpsertWatchInput,
): Promise<{ watch: WatchRow; created: boolean }> {
  const pool = getPool();
  const targetProvided = input.targetPrice !== undefined;
  const { rows } = await pool.query<WatchRow & { inserted: boolean }>(
    `INSERT INTO user_product_watch (user_id, product_id, market_id, target_price, currency, is_active)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     ON CONFLICT (user_id, product_id) DO UPDATE SET
       market_id = EXCLUDED.market_id,
       currency = EXCLUDED.currency,
       is_active = TRUE,
       target_price = CASE
         WHEN $6::boolean THEN EXCLUDED.target_price
         WHEN user_product_watch.market_id IS NOT DISTINCT FROM EXCLUDED.market_id
           THEN user_product_watch.target_price
         ELSE NULL
       END
     RETURNING *, (xmax = 0) AS inserted`,
    [
      input.userId,
      input.productId,
      input.marketId,
      input.targetPrice ?? null,
      input.currency,
      targetProvided,
    ],
  );
  const { inserted, ...watch } = rows[0];
  return { watch, created: inserted };
}

/**
 * Removes a watch by deactivating it (the project's convention is to
 * deactivate rather than physically delete). Scoped to the caller's own
 * row. Returns false when the user has no such watch.
 */
export async function deactivateWatch(
  userId: string,
  productId: string,
  marketId: string,
): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE user_product_watch
     SET is_active = FALSE
     WHERE user_id = $1 AND product_id = $2 AND market_id = $3`,
    [userId, productId, marketId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getWatch(
  userId: string,
  productId: string,
): Promise<WatchRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<WatchRow>(
    "SELECT * FROM user_product_watch WHERE user_id = $1 AND product_id = $2",
    [userId, productId],
  );
  return rows[0] ?? null;
}

/** True when the product has any offer in the market (the product/market relationship). */
export async function productHasOfferInMarket(
  productId: string,
  marketId: string,
): Promise<boolean> {
  const pool = getPool();
  const { rows } = await pool.query(
    "SELECT 1 FROM offers WHERE product_id = $1 AND market_id = $2 LIMIT 1",
    [productId, marketId],
  );
  return rows.length > 0;
}

export interface WatchlistRow extends WatchRow {
  product_name: string;
  product_slug: string;
  product_brand: string | null;
  product_image_url: string | null;
  product_status: string;
}

/** One page of the user's watches in a market, with product details. */
export async function listWatchlist(
  userId: string,
  marketId: string,
  includeInactive: boolean,
  limit: number,
  offset: number,
): Promise<{ rows: WatchlistRow[]; total: number }> {
  const pool = getPool();
  const activeClause = includeInactive ? "" : "AND w.is_active";
  const [dataResult, countResult] = await Promise.all([
    pool.query<WatchlistRow>(
      `SELECT w.*,
              p.name AS product_name, p.slug AS product_slug, p.brand AS product_brand,
              p.image_url AS product_image_url, p.status AS product_status
       FROM user_product_watch w
       JOIN products p ON p.product_id = w.product_id
       WHERE w.user_id = $1 AND w.market_id = $2 ${activeClause}
       ORDER BY w.created_at DESC, w.watch_id ASC
       LIMIT $3 OFFSET $4`,
      [userId, marketId, limit, offset],
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM user_product_watch w
       WHERE w.user_id = $1 AND w.market_id = $2 ${activeClause}`,
      [userId, marketId],
    ),
  ]);
  return { rows: dataResult.rows, total: Number(countResult.rows[0].count) };
}

export interface ActiveOfferRow {
  product_id: string;
  offer_id: string;
  merchant_id: string;
  merchant_name: string;
  merchant_slug: string;
  price: string;
  currency: string;
  availability_status: string;
  is_fixture: boolean;
}

/**
 * Active offers for a whole page of products in ONE query (no N+1). The
 * watchlist ranks them with the existing effective-price logic.
 */
export async function listActiveOffersForProducts(
  marketId: string,
  productIds: string[],
): Promise<ActiveOfferRow[]> {
  if (productIds.length === 0) {
    return [];
  }
  const pool = getPool();
  const { rows } = await pool.query<ActiveOfferRow>(
    `SELECT o.product_id, o.offer_id, o.merchant_id,
            m.name AS merchant_name, m.slug AS merchant_slug,
            o.price, o.currency, o.availability_status, o.is_fixture
     FROM offers o
     JOIN merchants m ON m.merchant_id = o.merchant_id
     WHERE o.market_id = $1 AND o.status = 'active' AND o.product_id = ANY($2::uuid[])`,
    [marketId, productIds],
  );
  return rows;
}
