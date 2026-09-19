import { getPool } from "../config/database.js";

export interface DealRow {
  deal_id: string;
  offer_id: string | null;
  product_id: string | null;
  merchant_id: string;
  category_id: string | null;
  market_id: string;
  title: string;
  slug: string;
  description: string | null;
  deal_type: string;
  original_price: string | null;
  sale_price: string | null;
  discount_percentage: string | null;
  currency: string;
  coupon_code: string | null;
  starts_at: string | null;
  expires_at: string | null;
  deal_status: string;
  verification_status: string;
  featured_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface DealFilters {
  marketId?: string;
  categoryId?: string;
  merchantId?: string;
  status?: string;
}

export interface CreateDealInput {
  merchantId: string;
  marketId: string;
  title: string;
  slug: string;
  description?: string;
  offerId?: string;
  productId?: string;
  categoryId?: string;
  dealType?: string;
  originalPrice?: number;
  salePrice?: number;
  discountPercentage?: number;
  currency: string;
  couponCode?: string;
  startsAt?: string;
  expiresAt?: string;
  dealStatus?: string;
  verificationStatus?: string;
  featuredStatus?: boolean;
}

/** merchant_id/market_id are not updatable, same reasoning as offers. */
export interface UpdateDealInput {
  title?: string;
  description?: string;
  offerId?: string;
  productId?: string;
  categoryId?: string;
  dealType?: string;
  originalPrice?: number;
  salePrice?: number;
  discountPercentage?: number;
  currency?: string;
  couponCode?: string;
  startsAt?: string;
  expiresAt?: string;
  dealStatus?: string;
  verificationStatus?: string;
  featuredStatus?: boolean;
}

export async function listDeals(
  filters: DealFilters,
  limit: number,
  offset: number,
): Promise<{ rows: DealRow[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.marketId) {
    values.push(filters.marketId);
    conditions.push(`market_id = $${values.length}`);
  }
  if (filters.categoryId) {
    values.push(filters.categoryId);
    conditions.push(`category_id = $${values.length}`);
  }
  if (filters.merchantId) {
    values.push(filters.merchantId);
    conditions.push(`merchant_id = $${values.length}`);
  }
  if (filters.status) {
    values.push(filters.status);
    conditions.push(`deal_status = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const dataQuery = `SELECT * FROM deals ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  const countQuery = `SELECT COUNT(*)::text AS count FROM deals ${where}`;

  const [dataResult, countResult] = await Promise.all([
    pool.query<DealRow>(dataQuery, [...values, limit, offset]),
    pool.query<{ count: string }>(countQuery, values),
  ]);

  return { rows: dataResult.rows, total: Number(countResult.rows[0].count) };
}

export async function getDealById(dealId: string): Promise<DealRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<DealRow>(
    "SELECT * FROM deals WHERE deal_id = $1",
    [dealId],
  );
  return rows[0] ?? null;
}

export async function createDeal(input: CreateDealInput): Promise<DealRow> {
  const pool = getPool();
  const { rows } = await pool.query<DealRow>(
    `INSERT INTO deals (
       merchant_id, market_id, title, slug, description, offer_id, product_id, category_id,
       deal_type, original_price, sale_price, discount_percentage, currency, coupon_code,
       starts_at, expires_at, deal_status, verification_status, featured_status
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8,
       COALESCE($9, 'discount'), $10, $11, $12, $13, $14,
       $15, $16, COALESCE($17, 'draft'), COALESCE($18, 'unverified'), COALESCE($19, false)
     )
     RETURNING *`,
    [
      input.merchantId,
      input.marketId,
      input.title,
      input.slug,
      input.description ?? null,
      input.offerId ?? null,
      input.productId ?? null,
      input.categoryId ?? null,
      input.dealType ?? null,
      input.originalPrice ?? null,
      input.salePrice ?? null,
      input.discountPercentage ?? null,
      input.currency,
      input.couponCode ?? null,
      input.startsAt ?? null,
      input.expiresAt ?? null,
      input.dealStatus ?? null,
      input.verificationStatus ?? null,
      input.featuredStatus ?? null,
    ],
  );
  return rows[0];
}

export async function updateDeal(
  dealId: string,
  input: UpdateDealInput,
): Promise<DealRow | null> {
  const pool = getPool();
  const sets: string[] = [];
  const values: unknown[] = [];

  function set(column: string, value: unknown): void {
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  }

  if (input.title !== undefined) set("title", input.title);
  if (input.description !== undefined) set("description", input.description);
  if (input.offerId !== undefined) set("offer_id", input.offerId);
  if (input.productId !== undefined) set("product_id", input.productId);
  if (input.categoryId !== undefined) set("category_id", input.categoryId);
  if (input.dealType !== undefined) set("deal_type", input.dealType);
  if (input.originalPrice !== undefined) set("original_price", input.originalPrice);
  if (input.salePrice !== undefined) set("sale_price", input.salePrice);
  if (input.discountPercentage !== undefined) set("discount_percentage", input.discountPercentage);
  if (input.currency !== undefined) set("currency", input.currency);
  if (input.couponCode !== undefined) set("coupon_code", input.couponCode);
  if (input.startsAt !== undefined) set("starts_at", input.startsAt);
  if (input.expiresAt !== undefined) set("expires_at", input.expiresAt);
  if (input.dealStatus !== undefined) set("deal_status", input.dealStatus);
  if (input.verificationStatus !== undefined) set("verification_status", input.verificationStatus);
  if (input.featuredStatus !== undefined) set("featured_status", input.featuredStatus);

  if (sets.length === 0) {
    return getDealById(dealId);
  }

  values.push(dealId);
  const { rows } = await pool.query<DealRow>(
    `UPDATE deals SET ${sets.join(", ")} WHERE deal_id = $${values.length} RETURNING *`,
    values,
  );
  return rows[0] ?? null;
}

/** Deactivate via deal_status = 'archived' (the deal lifecycle's
 * terminal state, per docs/architecture/GDN_Data_Architecture.md)
 * rather than a physical DELETE. */
export async function archiveDeal(dealId: string): Promise<DealRow | null> {
  return updateDeal(dealId, { dealStatus: "archived" });
}
