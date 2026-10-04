import { getPool } from "../config/database.js";

/**
 * Read-only queries for the public SEO pages and sitemaps. A page or
 * sitemap entry exists only for REAL data: active products with at least
 * one active, non-fixture (non-sample) offer in the market. Everything is
 * parameterized.
 */
export interface SeoProductRef {
  product_id: string;
  slug: string;
}

export async function findActiveProductBySlug(slug: string): Promise<SeoProductRef | null> {
  const { rows } = await getPool().query<SeoProductRef>(
    "SELECT product_id, slug FROM products WHERE slug = $1 AND status = 'active'",
    [slug],
  );
  return rows[0] ?? null;
}

export interface SeoMarket {
  market_id: string;
  code: string;
  name: string;
  currency: string;
}

export async function findMarketByCode(code: string): Promise<SeoMarket | null> {
  const { rows } = await getPool().query<SeoMarket>(
    "SELECT market_id, code, name, currency FROM markets WHERE upper(code) = upper($1) LIMIT 1",
    [code],
  );
  return rows[0] ?? null;
}

export async function findCategoryBySlug(
  slug: string,
): Promise<{ category_id: string; name: string; slug: string } | null> {
  const { rows } = await getPool().query<{ category_id: string; name: string; slug: string }>(
    "SELECT category_id, name, slug FROM categories WHERE slug = $1",
    [slug],
  );
  return rows[0] ?? null;
}

export async function findActiveMerchantBySlug(
  slug: string,
): Promise<{ merchant_id: string; name: string; slug: string } | null> {
  const { rows } = await getPool().query<{ merchant_id: string; name: string; slug: string }>(
    "SELECT merchant_id, name, slug FROM merchants WHERE slug = $1 AND merchant_status = 'active'",
    [slug],
  );
  return rows[0] ?? null;
}

export interface ListingProductRow {
  product_id: string;
  name: string;
  slug: string;
  brand: string | null;
  image_url: string | null;
}

export interface ListingFilter {
  marketId: string;
  categoryId?: string;
  merchantId?: string;
}

/** One page of products that have a real offer in the market (optionally in a category / at a merchant). */
export async function listQualifyingProducts(
  filter: ListingFilter,
  limit: number,
  offset: number,
): Promise<{ rows: ListingProductRow[]; total: number }> {
  const pool = getPool();
  const values: unknown[] = [filter.marketId];
  let productFilter = "";
  if (filter.categoryId) {
    values.push(filter.categoryId);
    productFilter = ` AND p.category_id = $${values.length}`;
  }
  let offerFilter = "";
  if (filter.merchantId) {
    values.push(filter.merchantId);
    offerFilter = ` AND o.merchant_id = $${values.length}`;
  }
  const where =
    `p.status = 'active'${productFilter} AND EXISTS (` +
    `SELECT 1 FROM offers o WHERE o.product_id = p.product_id AND o.market_id = $1 ` +
    `AND o.status = 'active' AND o.is_fixture = FALSE${offerFilter})`;

  const [data, count] = await Promise.all([
    pool.query<ListingProductRow>(
      `SELECT p.product_id, p.name, p.slug, p.brand, p.image_url
       FROM products p WHERE ${where}
       ORDER BY p.name ASC, p.product_id ASC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    ),
    pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM products p WHERE ${where}`, values),
  ]);
  return { rows: data.rows, total: Number(count.rows[0]?.count ?? 0) };
}

export interface SitemapRow {
  slug: string;
  lastmod: Date | null;
}

export async function listSitemapProducts(marketId: string, limit: number): Promise<SitemapRow[]> {
  const { rows } = await getPool().query<SitemapRow>(
    `SELECT p.slug, MAX(o.updated_at) AS lastmod
     FROM products p JOIN offers o ON o.product_id = p.product_id
     WHERE p.status = 'active' AND o.market_id = $1 AND o.status = 'active' AND o.is_fixture = FALSE
     GROUP BY p.product_id, p.slug ORDER BY p.slug ASC LIMIT $2`,
    [marketId, limit],
  );
  return rows;
}

export async function listSitemapCategories(marketId: string, limit: number): Promise<SitemapRow[]> {
  const { rows } = await getPool().query<SitemapRow>(
    `SELECT c.slug, MAX(o.updated_at) AS lastmod
     FROM categories c
     JOIN products p ON p.category_id = c.category_id
     JOIN offers o ON o.product_id = p.product_id
     WHERE p.status = 'active' AND o.market_id = $1 AND o.status = 'active' AND o.is_fixture = FALSE
     GROUP BY c.category_id, c.slug ORDER BY c.slug ASC LIMIT $2`,
    [marketId, limit],
  );
  return rows;
}

export async function listSitemapStores(marketId: string, limit: number): Promise<SitemapRow[]> {
  const { rows } = await getPool().query<SitemapRow>(
    `SELECT m.slug, MAX(o.updated_at) AS lastmod
     FROM merchants m
     JOIN offers o ON o.merchant_id = m.merchant_id
     JOIN products p ON p.product_id = o.product_id
     WHERE m.merchant_status = 'active' AND p.status = 'active'
       AND o.market_id = $1 AND o.status = 'active' AND o.is_fixture = FALSE
     GROUP BY m.merchant_id, m.slug ORDER BY m.slug ASC LIMIT $2`,
    [marketId, limit],
  );
  return rows;
}
