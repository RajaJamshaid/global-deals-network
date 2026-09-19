import { getPool } from "../config/database.js";

export interface CategoryRow {
  category_id: string;
  parent_category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function listCategories(
  limit: number,
  offset: number,
): Promise<{ rows: CategoryRow[]; total: number }> {
  const pool = getPool();
  const [dataResult, countResult] = await Promise.all([
    pool.query<CategoryRow>(
      "SELECT * FROM categories ORDER BY name ASC LIMIT $1 OFFSET $2",
      [limit, offset],
    ),
    pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM categories",
    ),
  ]);
  return { rows: dataResult.rows, total: Number(countResult.rows[0].count) };
}

export async function getCategoryById(
  categoryId: string,
): Promise<CategoryRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<CategoryRow>(
    "SELECT * FROM categories WHERE category_id = $1",
    [categoryId],
  );
  return rows[0] ?? null;
}
