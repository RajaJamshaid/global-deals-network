import { getPool } from "../config/database.js";

/**
 * Resolves a normalised GTIN to an ACTIVE canonical product id, or null.
 * Parameterized; the only barcode -> product mapping is product_barcodes.
 */
export async function findActiveProductIdByGtin(gtin: string): Promise<string | null> {
  const pool = getPool();
  const { rows } = await pool.query<{ product_id: string }>(
    `SELECT b.product_id
     FROM product_barcodes b
     JOIN products p ON p.product_id = b.product_id
     WHERE b.gtin = $1 AND p.status = 'active'`,
    [gtin],
  );
  return rows[0]?.product_id ?? null;
}
