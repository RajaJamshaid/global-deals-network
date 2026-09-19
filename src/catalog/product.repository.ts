import { getPool } from "../config/database.js";

/**
 * Products are canonical and merchant-independent - no merchant_id
 * here, per the Stage 1C task and the Stage 1B decision documented in
 * docs/implementation/GDN_Stage1B_Database_Foundation.md. A
 * merchant's specific listing of a product lives in the offers
 * table instead.
 */
export interface ProductRow {
  product_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  categoryId?: string;
  status?: string;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  categoryId?: string;
  status?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  categoryId?: string;
  status?: string;
}

export async function listProducts(
  filters: ProductFilters,
  limit: number,
  offset: number,
): Promise<{ rows: ProductRow[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.categoryId) {
    values.push(filters.categoryId);
    conditions.push(`category_id = $${values.length}`);
  }
  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const dataQuery = `SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  const countQuery = `SELECT COUNT(*)::text AS count FROM products ${where}`;

  const [dataResult, countResult] = await Promise.all([
    pool.query<ProductRow>(dataQuery, [...values, limit, offset]),
    pool.query<{ count: string }>(countQuery, values),
  ]);

  return { rows: dataResult.rows, total: Number(countResult.rows[0].count) };
}

export async function getProductById(
  productId: string,
): Promise<ProductRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<ProductRow>(
    "SELECT * FROM products WHERE product_id = $1",
    [productId],
  );
  return rows[0] ?? null;
}

export async function createProduct(
  input: CreateProductInput,
): Promise<ProductRow> {
  const pool = getPool();
  const { rows } = await pool.query<ProductRow>(
    `INSERT INTO products (name, slug, description, brand, image_url, category_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'active'))
     RETURNING *`,
    [
      input.name,
      input.slug,
      input.description ?? null,
      input.brand ?? null,
      input.imageUrl ?? null,
      input.categoryId ?? null,
      input.status ?? null,
    ],
  );
  return rows[0];
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput,
): Promise<ProductRow | null> {
  const pool = getPool();
  const sets: string[] = [];
  const values: unknown[] = [];

  function set(column: string, value: unknown): void {
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  }

  if (input.name !== undefined) set("name", input.name);
  if (input.description !== undefined) set("description", input.description);
  if (input.brand !== undefined) set("brand", input.brand);
  if (input.imageUrl !== undefined) set("image_url", input.imageUrl);
  if (input.categoryId !== undefined) set("category_id", input.categoryId);
  if (input.status !== undefined) set("status", input.status);

  if (sets.length === 0) {
    return getProductById(productId);
  }

  values.push(productId);
  const { rows } = await pool.query<ProductRow>(
    `UPDATE products SET ${sets.join(", ")} WHERE product_id = $${values.length} RETURNING *`,
    values,
  );
  return rows[0] ?? null;
}

/**
 * "Delete" a product without a physical DELETE - products.status is
 * checked/enforced by the schema, and offers has ON DELETE CASCADE
 * from products, so a hard DELETE would silently wipe out every
 * offer for the product. Deactivating (status = 'inactive') is the
 * safe, schema-compatible interpretation of "delete/deactivate...
 * where compatible with the existing schema" - documented in
 * docs/implementation/GDN_Stage1C_Core_Data_API.md.
 */
export async function deactivateProduct(
  productId: string,
): Promise<ProductRow | null> {
  return updateProduct(productId, { status: "inactive" });
}
