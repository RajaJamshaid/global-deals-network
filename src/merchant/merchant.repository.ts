import { getPool } from "../config/database.js";

export interface MerchantRow {
  merchant_id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  description: string | null;
  merchant_type: string;
  affiliate_status: string;
  merchant_status: string;
  created_at: string;
  updated_at: string;
}

export interface MerchantFilters {
  status?: string;
}

export interface CreateMerchantInput {
  name: string;
  slug: string;
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
  merchantType?: string;
  affiliateStatus?: string;
  merchantStatus?: string;
}

export interface UpdateMerchantInput {
  name?: string;
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
  merchantType?: string;
  affiliateStatus?: string;
  merchantStatus?: string;
}

export async function listMerchants(
  filters: MerchantFilters,
  limit: number,
  offset: number,
): Promise<{ rows: MerchantRow[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`merchant_status = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const dataQuery = `SELECT * FROM merchants ${where} ORDER BY name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  const countQuery = `SELECT COUNT(*)::text AS count FROM merchants ${where}`;

  const [dataResult, countResult] = await Promise.all([
    pool.query<MerchantRow>(dataQuery, [...values, limit, offset]),
    pool.query<{ count: string }>(countQuery, values),
  ]);

  return { rows: dataResult.rows, total: Number(countResult.rows[0].count) };
}

export async function getMerchantById(
  merchantId: string,
): Promise<MerchantRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<MerchantRow>(
    "SELECT * FROM merchants WHERE merchant_id = $1",
    [merchantId],
  );
  return rows[0] ?? null;
}

export async function createMerchant(
  input: CreateMerchantInput,
): Promise<MerchantRow> {
  const pool = getPool();
  const { rows } = await pool.query<MerchantRow>(
    `INSERT INTO merchants (name, slug, website_url, logo_url, description, merchant_type, affiliate_status, merchant_status)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'retailer'), COALESCE($7, 'pending'), COALESCE($8, 'active'))
     RETURNING *`,
    [
      input.name,
      input.slug,
      input.websiteUrl ?? null,
      input.logoUrl ?? null,
      input.description ?? null,
      input.merchantType ?? null,
      input.affiliateStatus ?? null,
      input.merchantStatus ?? null,
    ],
  );
  return rows[0];
}

export async function updateMerchant(
  merchantId: string,
  input: UpdateMerchantInput,
): Promise<MerchantRow | null> {
  const pool = getPool();
  const sets: string[] = [];
  const values: unknown[] = [];

  function set(column: string, value: unknown): void {
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  }

  if (input.name !== undefined) set("name", input.name);
  if (input.websiteUrl !== undefined) set("website_url", input.websiteUrl);
  if (input.logoUrl !== undefined) set("logo_url", input.logoUrl);
  if (input.description !== undefined) set("description", input.description);
  if (input.merchantType !== undefined) set("merchant_type", input.merchantType);
  if (input.affiliateStatus !== undefined) set("affiliate_status", input.affiliateStatus);
  if (input.merchantStatus !== undefined) set("merchant_status", input.merchantStatus);

  if (sets.length === 0) {
    return getMerchantById(merchantId);
  }

  values.push(merchantId);
  const { rows } = await pool.query<MerchantRow>(
    `UPDATE merchants SET ${sets.join(", ")} WHERE merchant_id = $${values.length} RETURNING *`,
    values,
  );
  return rows[0] ?? null;
}

/**
 * Deactivate rather than physically DELETE - merchants is referenced
 * by offers/deals/affiliate_programs with CASCADE/RESTRICT rules;
 * merchant_status already models an 'inactive' state for exactly
 * this purpose. See docs/implementation/GDN_Stage1C_Core_Data_API.md.
 */
export async function deactivateMerchant(
  merchantId: string,
): Promise<MerchantRow | null> {
  return updateMerchant(merchantId, { merchantStatus: "inactive" });
}
