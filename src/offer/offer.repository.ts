import { getPool } from "../config/database.js";

export interface OfferRow {
  offer_id: string;
  product_id: string;
  merchant_id: string;
  market_id: string;
  offer_url: string;
  price: string;
  original_price: string | null;
  currency: string;
  condition: string;
  availability_status: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OfferFilters {
  productId?: string;
  merchantId?: string;
  marketId?: string;
  status?: string;
}

export interface CreateOfferInput {
  productId: string;
  merchantId: string;
  marketId: string;
  offerUrl: string;
  price: number;
  originalPrice?: number;
  currency: string;
  condition?: string;
  availabilityStatus?: string;
  status?: string;
}

/**
 * product_id/merchant_id/market_id are deliberately not updatable -
 * they define the unique offer identity. Changing which product/
 * merchant/market an offer represents should be a new offer, not an
 * update to an existing one. Documented in
 * docs/implementation/GDN_Stage1C_Core_Data_API.md.
 */
export interface UpdateOfferInput {
  offerUrl?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  condition?: string;
  availabilityStatus?: string;
  status?: string;
}

export async function listOffers(
  filters: OfferFilters,
  limit: number,
  offset: number,
): Promise<{ rows: OfferRow[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.productId) {
    values.push(filters.productId);
    conditions.push(`product_id = $${values.length}`);
  }
  if (filters.merchantId) {
    values.push(filters.merchantId);
    conditions.push(`merchant_id = $${values.length}`);
  }
  if (filters.marketId) {
    values.push(filters.marketId);
    conditions.push(`market_id = $${values.length}`);
  }
  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const dataQuery = `SELECT * FROM offers ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  const countQuery = `SELECT COUNT(*)::text AS count FROM offers ${where}`;

  const [dataResult, countResult] = await Promise.all([
    pool.query<OfferRow>(dataQuery, [...values, limit, offset]),
    pool.query<{ count: string }>(countQuery, values),
  ]);

  return { rows: dataResult.rows, total: Number(countResult.rows[0].count) };
}

export async function getOfferById(offerId: string): Promise<OfferRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<OfferRow>(
    "SELECT * FROM offers WHERE offer_id = $1",
    [offerId],
  );
  return rows[0] ?? null;
}

export async function createOffer(input: CreateOfferInput): Promise<OfferRow> {
  const pool = getPool();
  const { rows } = await pool.query<OfferRow>(
    `INSERT INTO offers (product_id, merchant_id, market_id, offer_url, price, original_price, currency, condition, availability_status, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'new'), COALESCE($9, 'in_stock'), COALESCE($10, 'active'))
     RETURNING *`,
    [
      input.productId,
      input.merchantId,
      input.marketId,
      input.offerUrl,
      input.price,
      input.originalPrice ?? null,
      input.currency,
      input.condition ?? null,
      input.availabilityStatus ?? null,
      input.status ?? null,
    ],
  );
  return rows[0];
}

export async function updateOffer(
  offerId: string,
  input: UpdateOfferInput,
): Promise<OfferRow | null> {
  const pool = getPool();
  const sets: string[] = [];
  const values: unknown[] = [];

  function set(column: string, value: unknown): void {
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  }

  if (input.offerUrl !== undefined) set("offer_url", input.offerUrl);
  if (input.price !== undefined) set("price", input.price);
  if (input.originalPrice !== undefined) set("original_price", input.originalPrice);
  if (input.currency !== undefined) set("currency", input.currency);
  if (input.condition !== undefined) set("condition", input.condition);
  if (input.availabilityStatus !== undefined) set("availability_status", input.availabilityStatus);
  if (input.status !== undefined) set("status", input.status);

  if (sets.length === 0) {
    return getOfferById(offerId);
  }

  values.push(offerId);
  const { rows } = await pool.query<OfferRow>(
    `UPDATE offers SET ${sets.join(", ")} WHERE offer_id = $${values.length} RETURNING *`,
    values,
  );
  return rows[0] ?? null;
}

/** Deactivate via status = 'removed' (a real value in the offers
 * status CHECK constraint) rather than a physical DELETE. */
export async function deactivateOffer(offerId: string): Promise<OfferRow | null> {
  return updateOffer(offerId, { status: "removed" });
}
