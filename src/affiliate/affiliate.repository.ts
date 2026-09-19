import { getPool } from "../config/database.js";

export interface AffiliateProgramRow {
  affiliate_program_id: string;
  merchant_id: string;
  network_name: string;
  external_program_id: string | null;
  program_name: string;
  commission_type: string;
  commission_value: string | null;
  cookie_duration_days: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function getAffiliateProgramByMerchant(
  merchantId: string,
): Promise<AffiliateProgramRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<AffiliateProgramRow>(
    `SELECT * FROM affiliate_programs
     WHERE merchant_id = $1
     ORDER BY created_at ASC
     LIMIT 1`,
    [merchantId],
  );
  return rows[0] ?? null;
}

export interface AffiliateLinkRow {
  affiliate_link_id: string;
  affiliate_program_id: string;
  merchant_id: string;
  deal_id: string | null;
  product_id: string | null;
  destination_url: string;
  affiliate_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Used to avoid creating a duplicate affiliate_links row for the
 * same program + destination. Note: affiliate_links has no unique
 * DB constraint on (affiliate_program_id, destination_url) - this is
 * an application-level idempotency check, not a guaranteed-atomic
 * one under concurrent requests. Documented as a known Stage 1D
 * limitation in
 * docs/implementation/GDN_Stage1D_Amazon_Affiliate_Commerce_Foundation.md
 * rather than adding a migration for a constraint that isn't clearly
 * required yet (per the task's "stop and explain" rule on schema
 * changes).
 */
export async function findAffiliateLinkByDestination(
  affiliateProgramId: string,
  destinationUrl: string,
): Promise<AffiliateLinkRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<AffiliateLinkRow>(
    `SELECT * FROM affiliate_links
     WHERE affiliate_program_id = $1 AND destination_url = $2
     ORDER BY created_at ASC
     LIMIT 1`,
    [affiliateProgramId, destinationUrl],
  );
  return rows[0] ?? null;
}

export async function getAffiliateLinkById(
  affiliateLinkId: string,
): Promise<AffiliateLinkRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<AffiliateLinkRow>(
    "SELECT * FROM affiliate_links WHERE affiliate_link_id = $1",
    [affiliateLinkId],
  );
  return rows[0] ?? null;
}

export interface CreateAffiliateLinkInput {
  affiliateProgramId: string;
  merchantId: string;
  destinationUrl: string;
  affiliateUrl: string;
  productId?: string | null;
  dealId?: string | null;
}

export async function createAffiliateLink(
  input: CreateAffiliateLinkInput,
): Promise<AffiliateLinkRow> {
  const pool = getPool();
  const { rows } = await pool.query<AffiliateLinkRow>(
    `INSERT INTO affiliate_links (affiliate_program_id, merchant_id, deal_id, product_id, destination_url, affiliate_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'active')
     RETURNING *`,
    [
      input.affiliateProgramId,
      input.merchantId,
      input.dealId ?? null,
      input.productId ?? null,
      input.destinationUrl,
      input.affiliateUrl,
    ],
  );
  return rows[0];
}
