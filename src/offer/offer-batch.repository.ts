import { getPool } from "../config/database.js";

/**
 * One query for the ACTIVE offers of a whole page of products in a
 * market (no N+1). Shared by product search and the watchlist, which rank
 * the rows with the existing effective-price logic.
 */
export interface ActiveOfferRow {
  product_id: string;
  offer_id: string;
  merchant_id: string;
  merchant_name: string;
  merchant_slug: string;
  price: string;
  original_price: string | null;
  currency: string;
  availability_status: string;
  is_fixture: boolean;
  updated_at: Date;
}

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
            o.price, o.original_price, o.currency, o.availability_status,
            o.is_fixture, o.updated_at
     FROM offers o
     JOIN merchants m ON m.merchant_id = o.merchant_id
     WHERE o.market_id = $1 AND o.status = 'active' AND o.product_id = ANY($2::uuid[])`,
    [marketId, productIds],
  );
  return rows;
}
