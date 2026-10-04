import { getPool } from "../config/database.js";

/**
 * Data access for price alerts. Uses the existing tables from migration
 * 014 (user_product_watch, price_alert_event) and the observation log
 * from migration 013 - no schema changes.
 */

export interface TargetWatchRow {
  watch_id: string;
  user_id: string;
  target_price: string;
}

/** Active watches of a product in a market that have a target price. */
export async function listActiveTargetWatches(
  productId: string,
  marketId: string,
): Promise<TargetWatchRow[]> {
  const pool = getPool();
  const { rows } = await pool.query<TargetWatchRow>(
    `SELECT watch_id, user_id, target_price
     FROM user_product_watch
     WHERE product_id = $1 AND market_id = $2 AND is_active AND target_price IS NOT NULL`,
    [productId, marketId],
  );
  return rows;
}

export interface ObservationRow {
  history_id: string;
  price: string;
  currency: string;
  observed_at: Date;
}

/** Most recent REAL (non-fixture) observations of an offer, newest first. */
export async function getLatestObservations(
  offerId: string,
  limit: number,
): Promise<ObservationRow[]> {
  const pool = getPool();
  const { rows } = await pool.query<ObservationRow>(
    `SELECT history_id, price, currency, observed_at
     FROM product_price_history
     WHERE offer_id = $1 AND is_fixture = FALSE
     ORDER BY observed_at DESC, created_at DESC
     LIMIT $2`,
    [offerId, limit],
  );
  return rows;
}

export interface NewTargetReachedEvents {
  watchIds: string[];
  merchantId: string;
  offerId: string;
  /** The price observation that triggered the alert (dedupe key). */
  historyId: string;
  triggerPrice: number;
  previousPrice: number | null;
  currency: string;
}

/**
 * Inserts one pending 'target_price_reached' event per watch. The
 * partial unique index (watch_id, history_id, event_type) makes this
 * idempotent: re-running for the same observation inserts nothing.
 *
 * The WHERE clause re-checks that each watch is still active and its
 * target is still met. That is only a race guard (a watch deactivated or
 * changed between the read and this insert); the eligibility decision
 * itself is made by isTargetReached() in the alert service.
 *
 * Events are created as 'pending' with no delivery channel: nothing is
 * sent yet, and nothing here claims otherwise.
 *
 * Returns the number of events actually created.
 */
export async function insertTargetReachedEvents(
  input: NewTargetReachedEvents,
): Promise<number> {
  if (input.watchIds.length === 0) {
    return 0;
  }
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO price_alert_event
       (watch_id, user_id, product_id, merchant_id, offer_id, history_id,
        event_type, trigger_price, previous_price, target_price, currency, status)
     SELECT w.watch_id, w.user_id, w.product_id, $2::uuid, $3::uuid, $4::uuid,
            'target_price_reached', $5::numeric, $6::numeric, w.target_price, $7::text, 'pending'
     FROM user_product_watch w
     WHERE w.watch_id = ANY($1::uuid[])
       AND w.is_active
       AND w.target_price IS NOT NULL
       AND w.target_price >= $5::numeric
     ON CONFLICT (watch_id, history_id, event_type) WHERE history_id IS NOT NULL DO NOTHING`,
    [
      input.watchIds,
      input.merchantId,
      input.offerId,
      input.historyId,
      input.triggerPrice,
      input.previousPrice,
      input.currency,
    ],
  );
  return result.rowCount ?? 0;
}
