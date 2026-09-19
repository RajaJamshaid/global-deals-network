import { getPool } from "../config/database.js";

export interface MarketRow {
  market_id: string;
  code: string;
  name: string;
  currency: string;
  language: string;
  timezone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function listMarkets(
  limit: number,
  offset: number,
): Promise<{ rows: MarketRow[]; total: number }> {
  const pool = getPool();
  const [dataResult, countResult] = await Promise.all([
    pool.query<MarketRow>(
      "SELECT * FROM markets ORDER BY name ASC LIMIT $1 OFFSET $2",
      [limit, offset],
    ),
    pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM markets",
    ),
  ]);
  return { rows: dataResult.rows, total: Number(countResult.rows[0].count) };
}

export async function getMarketById(
  marketId: string,
): Promise<MarketRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<MarketRow>(
    "SELECT * FROM markets WHERE market_id = $1",
    [marketId],
  );
  return rows[0] ?? null;
}
