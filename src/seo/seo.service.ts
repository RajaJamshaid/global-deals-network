import { getProductIntelligenceService } from "../catalog/product-intelligence.service.js";
import { rankOffersByEffectivePrice } from "../deal/intelligence/effective-price.js";
import { listActiveOffersForProducts } from "../offer/offer-batch.repository.js";
import { formatMoney } from "./html.js";
import {
  findActiveMerchantBySlug,
  findActiveProductBySlug,
  findCategoryBySlug,
  findMarketByCode,
  listQualifyingProducts,
  listSitemapCategories,
  listSitemapProducts,
  listSitemapStores,
  type ListingProductRow,
  type SeoMarket,
} from "./seo.repository.js";
import {
  buildListingSeo,
  buildProductSeo,
  type PageSeo,
  type SeoAvailability,
} from "./seo-metadata.js";
import {
  MAX_SITEMAP_URLS,
  buildRobotsTxt,
  buildSitemapIndex,
  buildUrlset,
} from "./sitemap.js";
import {
  renderLayout,
  renderListingBody,
  renderNotFoundBody,
  renderProductBody,
  type ListingItemView,
  type OfferView,
} from "./templates.js";

/**
 * Public SEO pages. This layer only COMPOSES existing services: a product
 * page is the same product intelligence every other discovery method uses
 * (getProductIntelligenceService), shown as HTML. There is no pricing,
 * ranking or scoring here.
 *
 * Rules that keep the site free of thin or fake pages:
 *  - sample (fixture) offers are never shown, counted or indexed;
 *  - a product page without real offers is rendered but marked noindex;
 *  - category / store pages exist only when they have real products;
 *  - sitemaps list only pages that qualify (an empty catalogue gives an
 *    empty, valid sitemap);
 *  - only the default market is indexable; other markets are noindex and
 *    canonicalise back to the main product URL.
 */
export interface SeoConfig {
  siteUrl: string;
  /** Base URL of the API as seen by browsers ("" = same origin). */
  publicApiUrl: string;
  defaultMarketCode: string;
}

export type SeoResponse =
  | { kind: "html"; status: number; html: string }
  | { kind: "redirect"; location: string }
  | { kind: "xml"; xml: string }
  | { kind: "text"; text: string };

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,199}$/;
const MARKET_CODE_PATTERN = /^[A-Za-z]{2,8}$/;
const SITE_NAME = "Global Deals Network";
export const LISTING_PAGE_SIZE = 24;
const MAX_PAGE = 1000;

function availabilityOf(status: string): SeoAvailability {
  return status === "in_stock" || status === "out_of_stock" ? status : "unknown";
}

function availabilityLabel(status: string): string {
  if (status === "in_stock") return "In stock";
  if (status === "out_of_stock") return "Out of stock";
  return "Availability unknown";
}

function notFoundPage(config: SeoConfig): SeoResponse {
  const seo: PageSeo = {
    title: "Page not found | GDN",
    description: "This page could not be found.",
    canonical: `${config.siteUrl}/`,
    robots: "noindex,follow",
    ogImage: null,
    twitterCard: "summary",
    jsonLd: [],
  };
  return {
    kind: "html",
    status: 404,
    html: renderLayout({ seo, siteName: SITE_NAME, body: renderNotFoundBody() }),
  };
}

async function resolveMarket(
  query: Record<string, unknown>,
  config: SeoConfig,
): Promise<{ market: SeoMarket; isDefault: boolean } | null> {
  let code = config.defaultMarketCode;
  if (query.market !== undefined) {
    if (typeof query.market !== "string" || !MARKET_CODE_PATTERN.test(query.market)) {
      return null;
    }
    code = query.market.toUpperCase();
  }
  const market = await findMarketByCode(code);
  if (!market) return null;
  return { market, isDefault: code === config.defaultMarketCode.toUpperCase() };
}

function parsePage(raw: unknown): number | null {
  if (raw === undefined) return 1;
  if (typeof raw !== "string" || !/^\d{1,4}$/.test(raw)) return null;
  const page = Number(raw);
  return page >= 1 && page <= MAX_PAGE ? page : null;
}

export async function renderProductPageService(
  rawSlug: string,
  query: Record<string, unknown>,
  config: SeoConfig,
): Promise<SeoResponse> {
  const slug = rawSlug.toLowerCase();
  if (!SLUG_PATTERN.test(slug)) return notFoundPage(config);
  if (slug !== rawSlug) {
    return { kind: "redirect", location: `/product/${slug}` };
  }

  const resolved = await resolveMarket(query, config);
  if (!resolved) return notFoundPage(config);
  const product = await findActiveProductBySlug(slug);
  if (!product) return notFoundPage(config);

  // The single comparison pipeline (offers, ranking, effective price, price
  // status, Deal Score, affiliate redirect paths).
  const detail = await getProductIntelligenceService(product.product_id, resolved.market.market_id);
  const real = detail.offers.filter((offer) => !offer.is_fixture);
  const offers: OfferView[] = real.map((offer, index) => ({
    rank: index + 1,
    merchantName: offer.merchant?.name ?? "Store",
    listedPrice: offer.listed_price,
    effectivePrice: offer.effective_price,
    currency: offer.currency,
    availabilityLabel: availabilityLabel(offer.availability_status),
    shopUrl: offer.redirect_path ? `${config.publicApiUrl}${offer.redirect_path}` : null,
  }));

  const indexable = resolved.isDefault && real.length > 0;
  const seo = buildProductSeo({
    siteUrl: config.siteUrl,
    name: detail.name,
    slug: detail.slug,
    brand: detail.brand,
    description: detail.description,
    imageUrl: detail.image_url,
    category: detail.category ? { name: detail.category.name, slug: detail.category.slug } : null,
    offers: real.map((offer) => ({
      merchantName: offer.merchant?.name ?? "Store",
      listedPrice: offer.listed_price,
      effectivePrice: offer.effective_price,
      currency: offer.currency,
      availability: availabilityOf(offer.availability_status),
    })),
    indexable,
  });

  const body = renderProductBody({
    name: detail.name,
    brand: detail.brand,
    description: detail.description,
    imageUrl: detail.image_url,
    category: detail.category ? { name: detail.category.name, slug: detail.category.slug } : null,
    showCategoryLink: indexable,
    market: { code: detail.market.code, name: detail.market.name, currency: detail.market.currency },
    offers,
    priceStatus: {
      status: detail.price_status.status,
      differencePct: detail.price_status.difference_pct,
      averagePrice: detail.price_status.average_price,
      minPrice: detail.price_status.min_price,
      maxPrice: detail.price_status.max_price,
      observationCount: detail.price_status.observation_count,
      windowDays: detail.price_status.window_days,
      message: detail.price_status.message,
    },
    dealScore: {
      score: detail.deal_score.score,
      rating: detail.deal_score.rating,
      reasons: detail.deal_score.reasons,
    },
  });

  return { kind: "html", status: 200, html: renderLayout({ seo, siteName: SITE_NAME, body }) };
}

/** Lowest shown price per product among REAL offers, with one query for the whole page. */
async function listingItems(
  rows: ListingProductRow[],
  marketId: string,
  merchantId?: string,
): Promise<ListingItemView[]> {
  const offers = (await listActiveOffersForProducts(marketId, rows.map((row) => row.product_id))).filter(
    (offer) => !offer.is_fixture && (merchantId === undefined || offer.merchant_id === merchantId),
  );
  return rows.map((row) => {
    const productOffers = offers.filter((offer) => offer.product_id === row.product_id);
    const [best] = rankOffersByEffectivePrice(
      productOffers.map((offer) => ({
        offerId: offer.offer_id,
        listedPrice: Number(offer.price),
        inStock: offer.availability_status !== "out_of_stock",
      })),
    );
    const bestOffer = best ? productOffers.find((offer) => offer.offer_id === best.offerId) : undefined;
    return {
      name: row.name,
      slug: row.slug,
      brand: row.brand,
      imageUrl: row.image_url,
      priceText:
        best && bestOffer
          ? `${merchantId === undefined ? "From " : ""}${formatMoney(best.effectivePrice, bestOffer.currency)}${merchantId === undefined ? ` at ${bestOffer.merchant_name}` : ""}`
          : null,
      offerCount: merchantId === undefined ? productOffers.length : 1,
    };
  });
}

async function renderListing(
  kind: "category" | "store",
  entity: { id: string; name: string; slug: string },
  query: Record<string, unknown>,
  config: SeoConfig,
): Promise<SeoResponse> {
  const page = parsePage(query.page);
  if (page === null) return notFoundPage(config);
  const resolved = await resolveMarket({}, config);
  if (!resolved) return notFoundPage(config);

  const { rows, total } = await listQualifyingProducts(
    {
      marketId: resolved.market.market_id,
      categoryId: kind === "category" ? entity.id : undefined,
      merchantId: kind === "store" ? entity.id : undefined,
    },
    LISTING_PAGE_SIZE,
    (page - 1) * LISTING_PAGE_SIZE,
  );
  // No thin pages: nothing to list means no page.
  if (total === 0 || rows.length === 0) return notFoundPage(config);

  const items = await listingItems(
    rows,
    resolved.market.market_id,
    kind === "store" ? entity.id : undefined,
  );
  const seo = buildListingSeo({
    siteUrl: config.siteUrl,
    kind,
    name: entity.name,
    slug: entity.slug,
    marketName: resolved.market.name,
    items: rows.map((row) => ({ name: row.name, slug: row.slug })),
    total,
    page,
  });
  const body = renderListingBody({
    heading: kind === "category" ? entity.name : `${entity.name} products`,
    intro:
      kind === "category"
        ? `${total} ${total === 1 ? "product" : "products"} with store offers in ${resolved.market.name}.`
        : `${total} ${total === 1 ? "product" : "products"} offered by ${entity.name} in ${resolved.market.name}.`,
    items,
    total,
    page,
    pageSize: LISTING_PAGE_SIZE,
    basePath: `/${kind}/${entity.slug}`,
  });
  return { kind: "html", status: 200, html: renderLayout({ seo, siteName: SITE_NAME, body }) };
}

export async function renderCategoryPageService(
  rawSlug: string,
  query: Record<string, unknown>,
  config: SeoConfig,
): Promise<SeoResponse> {
  const slug = rawSlug.toLowerCase();
  if (!SLUG_PATTERN.test(slug)) return notFoundPage(config);
  if (slug !== rawSlug) return { kind: "redirect", location: `/category/${slug}` };
  const category = await findCategoryBySlug(slug);
  if (!category) return notFoundPage(config);
  return renderListing("category", { id: category.category_id, name: category.name, slug: category.slug }, query, config);
}

export async function renderStorePageService(
  rawSlug: string,
  query: Record<string, unknown>,
  config: SeoConfig,
): Promise<SeoResponse> {
  const slug = rawSlug.toLowerCase();
  if (!SLUG_PATTERN.test(slug)) return notFoundPage(config);
  if (slug !== rawSlug) return { kind: "redirect", location: `/store/${slug}` };
  const merchant = await findActiveMerchantBySlug(slug);
  if (!merchant) return notFoundPage(config);
  return renderListing("store", { id: merchant.merchant_id, name: merchant.name, slug: merchant.slug }, query, config);
}

async function defaultMarket(config: SeoConfig): Promise<SeoMarket | null> {
  return findMarketByCode(config.defaultMarketCode);
}

export function sitemapIndexXml(config: SeoConfig): string {
  return buildSitemapIndex([
    `${config.siteUrl}/sitemap-products.xml`,
    `${config.siteUrl}/sitemap-categories.xml`,
    `${config.siteUrl}/sitemap-stores.xml`,
  ]);
}

export async function productsSitemapXml(config: SeoConfig): Promise<string> {
  const market = await defaultMarket(config);
  const rows = market ? await listSitemapProducts(market.market_id, MAX_SITEMAP_URLS) : [];
  return buildUrlset(rows.map((row) => ({ loc: `${config.siteUrl}/product/${row.slug}`, lastmod: row.lastmod })));
}

export async function categoriesSitemapXml(config: SeoConfig): Promise<string> {
  const market = await defaultMarket(config);
  const rows = market ? await listSitemapCategories(market.market_id, MAX_SITEMAP_URLS) : [];
  return buildUrlset(rows.map((row) => ({ loc: `${config.siteUrl}/category/${row.slug}`, lastmod: row.lastmod })));
}

export async function storesSitemapXml(config: SeoConfig): Promise<string> {
  const market = await defaultMarket(config);
  const rows = market ? await listSitemapStores(market.market_id, MAX_SITEMAP_URLS) : [];
  return buildUrlset(rows.map((row) => ({ loc: `${config.siteUrl}/store/${row.slug}`, lastmod: row.lastmod })));
}

export function robotsTxt(config: SeoConfig): string {
  return buildRobotsTxt(config.siteUrl);
}
