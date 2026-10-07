import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool, getPool } from "../../src/config/database.js";
import { env } from "../../src/config/env.js";
import { escapeHtml } from "../../src/seo/html.js";
import { TEST_BOT_TOKEN } from "../helpers/telegram-init-data.js";
import {
  buildAuthedServer,
  getSeededCategoryId,
  getSeededMarketId,
  uniqueSlug,
} from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

function jsonLdOf(html: string): any[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (match) => JSON.parse(match[1] as string),
  );
}

function randomLetters(length: number): string {
  return Array.from({ length }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");
}

describe.skipIf(!hasDatabase)("Public SEO pages (product, category, store, sitemaps, robots)", () => {
  // `app` creates test data (sends the fixture internal key); `publicApp` is a bare,
  // anonymous visitor with no credentials of any kind - a Google click.
  const app = buildAuthedServer();
  const publicApp = buildServer({ internalApiKey: undefined, telegramBotToken: undefined });

  afterAll(async () => {
    await app.close();
    await publicApp.close();
    await closePool();
  });

  async function createMerchant(name = "SEO Merchant"): Promise<{ merchantId: string; slug: string }> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name, slug: uniqueSlug("seo-merchant") },
    });
    const data = response.json().data;
    return { merchantId: data.merchant_id, slug: data.slug };
  }

  async function createProduct(extra: Record<string, unknown> = {}): Promise<{ productId: string; slug: string }> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name: "SEO Product", slug: uniqueSlug("seo-product"), ...extra },
    });
    const data = response.json().data;
    return { productId: data.product_id, slug: data.slug };
  }

  async function createOffer(
    productId: string,
    merchantId: string,
    price: number,
    extra: Record<string, unknown> = {},
  ): Promise<string> {
    const marketId = await getSeededMarketId(app);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: merchantId,
        market_id: marketId,
        offer_url: `https://example.com/raw/${randomUUID()}`,
        price,
        currency: "USD",
        ...extra,
      },
    });
    expect(response.statusCode).toBe(201);
    return response.json().data.offer_id;
  }

  async function createActiveDeal(productId: string, merchantId: string, offerId: string): Promise<string> {
    const marketId = await getSeededMarketId(app);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/deals",
      payload: {
        merchant_id: merchantId,
        market_id: marketId,
        product_id: productId,
        offer_id: offerId,
        title: "SEO Deal",
        slug: uniqueSlug("seo-deal"),
        currency: "USD",
        deal_status: "active",
      },
    });
    expect(response.statusCode).toBe(201);
    return response.json().data.deal_id;
  }

  async function insertHistory(productId: string, merchantId: string, offerId: string, price: number, count: number) {
    const marketId = await getSeededMarketId(app);
    for (let day = 1; day <= count; day += 1) {
      await getPool().query(
        `INSERT INTO product_price_history
           (product_id, merchant_id, market_id, offer_id, price, currency, source, is_fixture, observed_at)
         VALUES ($1, $2, $3, $4, $5, 'USD', 'offer_update', FALSE, now() - make_interval(days => $6::int))`,
        [productId, merchantId, marketId, offerId, price, day],
      );
    }
  }

  // ------------------------------------------------------------------
  // Product landing page
  // ------------------------------------------------------------------
  describe("product landing page", () => {
    it("renders the full comparison experience from real data for an anonymous visitor", async () => {
      const name = `Seo "Phone" <Pro> & Co ${randomLetters(6)}`;
      const categoryId = await getSeededCategoryId(app);
      const { productId, slug } = await createProduct({
        name,
        brand: "Acme",
        description: "A real description.",
        image_url: "https://cdn.example.com/p.png",
        category_id: categoryId,
      });
      const m1 = await createMerchant("Alpha Seo Store");
      const m2 = await createMerchant("Beta Seo Shop");
      const rawUrlToken = randomUUID();
      const offer1 = await createOffer(productId, m1.merchantId, 80, {
        original_price: 100,
        offer_url: `https://example.com/raw/${rawUrlToken}`,
      });
      await createOffer(productId, m2.merchantId, 90);
      await insertHistory(productId, m1.merchantId, offer1, 100, 10);
      const dealId = await createActiveDeal(productId, m1.merchantId, offer1);

      const response = await publicApp.inject({ method: "GET", url: `/product/${slug}` });
      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("text/html");
      expect(response.headers["content-security-policy"]).toContain("default-src 'none'");
      const html = response.body;

      // Metadata
      expect(html).toContain(`<title>${escapeHtml(`${name} Price Comparison | GDN`)}</title>`);
      expect(html).toContain(`<link rel="canonical" href="${escapeHtml(`${env.siteUrl}/product/${slug}`)}">`);
      expect(html).toContain('<meta name="robots" content="index,follow">');
      expect(html).toContain('<meta property="og:image" content="https://cdn.example.com/p.png">');
      expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
      expect(html).toMatch(/<meta name="description" content="Compare 2 store prices for/);

      // Structured data: real values only
      const ld = jsonLdOf(html);
      expect(ld.map((entry) => entry["@type"]).sort()).toEqual(["BreadcrumbList", "Organization", "Product"]);
      const product = ld.find((entry) => entry["@type"] === "Product");
      expect(product.name).toBe(name);
      expect(product.brand.name).toBe("Acme");
      expect(product.offers).toMatchObject({ priceCurrency: "USD", lowPrice: "80.00", highPrice: "90.00", offerCount: 2 });
      expect(product.offers.offers.map((offer: any) => offer.seller.name).sort()).toEqual(["Alpha Seo Store", "Beta Seo Shop"]);
      expect(JSON.stringify(ld)).not.toMatch(/aggregateRating|ratingValue|reviewCount|"review"/i);

      // Comparison, intelligence and CTAs
      expect(html).toContain("USD 80.00");
      expect(html).toContain("USD 90.00");
      expect(html).toContain("Best available price");
      expect(html).toContain("Alpha Seo Store");
      expect(html).toContain("Beta Seo Shop");
      expect(html).toContain("recent average price");
      expect(html).toContain("GDN Deal Score:");
      expect(html).toContain(`/api/v1/redirect/deal/${dealId}`);
      expect(html).toContain('rel="sponsored nofollow noopener"');

      // The raw merchant URL is never exposed; no secrets; no unsupported claims.
      expect(html).not.toContain(rawUrlToken);
      expect(html).not.toContain(process.env.GDN_INTERNAL_API_KEY as string);
      expect(html).not.toContain(TEST_BOT_TOKEN);
      expect(html).not.toMatch(/verified|guaranteed|official tier|real-?time/i);
    });

    it("works with no Telegram bot, internal key or signup configured (platform independent)", async () => {
      const { productId, slug } = await createProduct();
      await createOffer(productId, (await createMerchant()).merchantId, 10);
      const response = await publicApp.inject({ method: "GET", url: `/product/${slug}` });
      expect(response.statusCode).toBe(200);
    });

    it("answers 404 (noindex) for unknown, malformed and inactive products", async () => {
      const { productId, slug } = await createProduct();
      await createOffer(productId, (await createMerchant()).merchantId, 10);
      await app.inject({ method: "DELETE", url: `/api/v1/products/${productId}` });

      for (const path of [
        `/product/${slug}`,
        "/product/does-not-exist-xyz",
        "/product/Bad_Slug!",
        `/product/${"a".repeat(300)}`,
      ]) {
        const response = await publicApp.inject({ method: "GET", url: path });
        expect(response.statusCode, path).toBe(404);
        expect(response.body).toContain('content="noindex,follow"');
      }
    });

    it("redirects a non-canonical (upper-case) slug to the canonical URL", async () => {
      const { slug } = await createProduct();
      const response = await publicApp.inject({ method: "GET", url: `/product/${slug.toUpperCase()}` });
      expect(response.statusCode).toBe(301);
      expect(response.headers.location).toBe(`/product/${slug}`);
    });

    it("renders but noindexes a product with no real offers (no thin indexable page)", async () => {
      const { slug } = await createProduct({ name: "Lonely Product" });
      const response = await publicApp.inject({ method: "GET", url: `/product/${slug}` });
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('content="noindex,follow"');
      expect(response.body).toContain("No store offers are available for this product right now.");
      expect(response.body).toContain("<title>Lonely Product | GDN</title>");
      const product = jsonLdOf(response.body).find((entry) => entry["@type"] === "Product");
      expect(product.offers).toBeUndefined();
    });

    it("never shows or indexes sample (fixture) offers", async () => {
      const { productId, slug } = await createProduct();
      await createOffer(productId, (await createMerchant("Sample Only Store")).merchantId, 25, { is_fixture: true });
      const response = await publicApp.inject({ method: "GET", url: `/product/${slug}` });
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('content="noindex,follow"');
      expect(response.body).not.toContain("USD 25.00");
      expect(response.body).not.toContain("Sample Only Store");
    });

    it("keeps market context: another market never shows USA offers and is not indexable", async () => {
      const { productId, slug } = await createProduct();
      await createOffer(productId, (await createMerchant()).merchantId, 55);
      const code = randomLetters(5);
      await getPool().query(
        `INSERT INTO markets (code, name, currency, language, timezone) VALUES ($1, 'SEO Other Market', 'EUR', 'en', 'UTC')`,
        [code],
      );

      const other = await publicApp.inject({ method: "GET", url: `/product/${slug}?market=${code}` });
      expect(other.statusCode).toBe(200);
      expect(other.body).toContain('content="noindex,follow"');
      expect(other.body).not.toContain("USD 55.00");
      // Query parameters never create a second indexable URL.
      expect(other.body).toContain(`<link rel="canonical" href="${escapeHtml(`${env.siteUrl}/product/${slug}`)}">`);

      for (const bad of [randomLetters(5), "1;DROP", "%27"]) {
        const response = await publicApp.inject({ method: "GET", url: `/product/${slug}?market=${bad}` });
        expect(response.statusCode, bad).toBe(404);
      }
    });

    it("escapes hostile product data in the page and in the structured data", async () => {
      const { productId, slug } = await createProduct({
        name: "<script>alert(1)</script>",
        brand: "<i>x</i>",
        description: '"><img src=x onerror=alert(1)>',
      });
      await createOffer(productId, (await createMerchant("</script><b>Evil</b>")).merchantId, 5);

      const response = await publicApp.inject({ method: "GET", url: `/product/${slug}` });
      const html = response.body;
      expect(response.statusCode).toBe(200);
      expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
      expect(html).not.toContain("<script>alert(1)</script>");
      expect(html).not.toContain("<img src=x onerror");
      expect(html).not.toContain("<b>Evil</b>");
      // Every <script> on the page is structured data; none is executable.
      expect(html.match(/<script/g)).toHaveLength(jsonLdOf(html).length);
      const product = jsonLdOf(html).find((entry) => entry["@type"] === "Product");
      expect(product.name).toBe("<script>alert(1)</script>");
    });
  });

  // ------------------------------------------------------------------
  // Category and store pages
  // ------------------------------------------------------------------
  describe("category and store pages", () => {
    it("lists real products on a category page and omits sample-only products", async () => {
      const categoryId = await getSeededCategoryId(app);
      const real = await createProduct({ name: `000 Category Real ${randomLetters(4)}`, category_id: categoryId });
      await createOffer(real.productId, (await createMerchant("Cat Store")).merchantId, 70);
      const sample = await createProduct({ name: `000 Category Sample ${randomLetters(4)}`, category_id: categoryId });
      await createOffer(sample.productId, (await createMerchant()).merchantId, 70, { is_fixture: true });

      const response = await publicApp.inject({ method: "GET", url: "/category/electronics" });
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain(`/product/${real.slug}`);
      expect(response.body).not.toContain(`/product/${sample.slug}`);
      expect(response.body).toContain("From USD 70.00 at Cat Store");
      expect(response.body).toMatch(/<title>.* Price Comparison \| GDN<\/title>/);
      expect(response.body).toContain(`<link rel="canonical" href="${escapeHtml(`${env.siteUrl}/category/electronics`)}">`);
      const list = jsonLdOf(response.body).find((entry) => entry["@type"] === "ItemList");
      expect(list.itemListElement.map((entry: any) => entry.url)).toContain(`${env.siteUrl}/product/${real.slug}`);
    });

    it("has no page for an unknown category or an out-of-range page (no thin pages)", async () => {
      for (const path of ["/category/no-such-category-xyz", "/category/electronics?page=abc", "/category/electronics?page=9999", "/category/electronics?page=0"]) {
        const response = await publicApp.inject({ method: "GET", url: path });
        expect(response.statusCode, path).toBe(404);
      }
    });

    it("lists a merchant's real products on its store page", async () => {
      const store = await createMerchant("Gamma Seo Store");
      const p1 = await createProduct({ name: `Store Item One ${randomLetters(4)}` });
      const p2 = await createProduct({ name: `Store Item Two ${randomLetters(4)}` });
      await createOffer(p1.productId, store.merchantId, 30);
      await createOffer(p2.productId, store.merchantId, 45);

      const response = await publicApp.inject({ method: "GET", url: `/store/${store.slug}` });
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain(`/product/${p1.slug}`);
      expect(response.body).toContain(`/product/${p2.slug}`);
      expect(response.body).toContain("USD 30.00");
      expect(response.body).toContain("<title>Gamma Seo Store Price Comparison | GDN</title>");
      const orgs = jsonLdOf(response.body).filter((entry) => entry["@type"] === "Organization");
      expect(orgs.map((org) => org.name)).toContain("Gamma Seo Store");
    });

    it("has no store page for unknown stores, stores without offers, or sample-only stores", async () => {
      const noOffers = await createMerchant("No Offers Store");
      const sampleOnly = await createMerchant("Sample Only Seo Store");
      const product = await createProduct();
      await createOffer(product.productId, sampleOnly.merchantId, 9, { is_fixture: true });

      for (const path of ["/store/no-such-store-xyz", `/store/${noOffers.slug}`, `/store/${sampleOnly.slug}`]) {
        const response = await publicApp.inject({ method: "GET", url: path });
        expect(response.statusCode, path).toBe(404);
      }
    });
  });

  // ------------------------------------------------------------------
  // Sitemaps and robots.txt
  // ------------------------------------------------------------------
  describe("sitemaps and robots.txt", () => {
    it("serves a sitemap index pointing at the product, category and store sitemaps", async () => {
      const response = await publicApp.inject({ method: "GET", url: "/sitemap.xml" });
      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("application/xml");
      expect(response.body).toContain("<sitemapindex");
      for (const name of ["products", "categories", "stores"]) {
        expect(response.body).toContain(`<loc>${env.siteUrl}/sitemap-${name}.xml</loc>`);
      }
    });

    it("lists only real, indexable canonical pages", async () => {
      const categoryId = await getSeededCategoryId(app);
      const real = await createProduct({ category_id: categoryId });
      const store = await createMerchant("Sitemap Store");
      await createOffer(real.productId, store.merchantId, 20);
      const noOffers = await createProduct();
      const sampleOnly = await createProduct();
      await createOffer(sampleOnly.productId, (await createMerchant()).merchantId, 20, { is_fixture: true });

      const products = await publicApp.inject({ method: "GET", url: "/sitemap-products.xml" });
      expect(products.statusCode).toBe(200);
      expect(products.body.startsWith('<?xml version="1.0" encoding="UTF-8"?><urlset')).toBe(true);
      expect(products.body).toContain(`<loc>${env.siteUrl}/product/${real.slug}</loc>`);
      expect(products.body).not.toContain(noOffers.slug);
      expect(products.body).not.toContain(sampleOnly.slug);

      const categories = await publicApp.inject({ method: "GET", url: "/sitemap-categories.xml" });
      expect(categories.body).toContain(`<loc>${env.siteUrl}/category/electronics</loc>`);

      const stores = await publicApp.inject({ method: "GET", url: "/sitemap-stores.xml" });
      expect(stores.body).toContain(`<loc>${env.siteUrl}/store/${store.slug}</loc>`);
    });

    it("serves robots.txt that blocks the API and links the sitemap", async () => {
      const response = await publicApp.inject({ method: "GET", url: "/robots.txt" });
      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("text/plain");
      expect(response.body).toContain("Disallow: /api/");
      expect(response.body).toContain(`Sitemap: ${env.siteUrl}/sitemap.xml`);
    });
  });
});
