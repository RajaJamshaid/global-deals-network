import { getPool } from "../../config/database.js";

/**
 * Generic "does this ID exist?" check, shared by every service that
 * validates a foreign-key reference before writing (e.g. an offer's
 * product_id/merchant_id/market_id, a deal's optional offer_id/
 * product_id/category_id).
 *
 * The table name always comes from this fixed whitelist, never from
 * request input, so the string-interpolated identifier below is not
 * a SQL-injection risk - only the $1 value parameter is
 * user-supplied, and that stays parameterized.
 */
const ID_COLUMNS = {
  markets: "market_id",
  categories: "category_id",
  merchants: "merchant_id",
  products: "product_id",
  offers: "offer_id",
  deals: "deal_id",
} as const;

export type ExistsTable = keyof typeof ID_COLUMNS;

export async function recordExists(
  table: ExistsTable,
  id: string,
): Promise<boolean> {
  const pool = getPool();
  const idColumn = ID_COLUMNS[table];
  const { rows } = await pool.query(
    `SELECT 1 FROM ${table} WHERE ${idColumn} = $1`,
    [id],
  );
  return rows.length > 0;
}
