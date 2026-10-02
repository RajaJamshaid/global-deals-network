import { badRequest } from "../api/http/errors.js";
import { optionalUuid, requireUuid } from "../api/http/validation.js";
import { DEFAULT_PRICE_INTELLIGENCE_CONFIG } from "../deal/intelligence/intelligence.config.js";
import {
  computePriceStatus,
  type PriceObservation,
  type PriceVerdict,
  type PriceStatus,
} from "../deal/intelligence/price-status.js";
import { listObservationsForProducts } from "./price-history.repository.js";
import {
  searchProducts,
  type ProductSearchRow,
} from "./product-search.repository.js";
import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  parseSearchTerms,
} from "./search-query.js";

export interface ProductSearchResult {
  product_id: string;
  name: string;
  slug: string;
  brand: string | null;
  image_url: string | null;
  category_id: string | null;
  offer_count: number;
  best_offer: {
    offer_id: string;
    merchant: { merchant_id: string; name: string; slug: string };
    price: number;
    original_price: number | null;
    currency: string;
    availability_status: string;
    /** true = sample/test data, never live merchant pricing. */
    is_fixture: boolean;
  };
  /** Derived only from stored observations; "not_enough_data" until history exists. */
  price_status: {
    status: PriceStatus;
    verdict: PriceVerdict;
    difference_pct: number | null;
    observation_count: number;
  };
}

export async function searchProductsService(
  query: Record<string, unknown>,
  limit: number,
  offset: number,
): Promise<{ rows: ProductSearchResult[]; total: number }> {
  const rawQ = query.q;
  if (typeof rawQ !== "string") {
    throw badRequest("q query parameter is required");
  }
  const phrase = rawQ.trim().replace(/\s+/g, " ");
  if (phrase.length < MIN_QUERY_LENGTH || phrase.length > MAX_QUERY_LENGTH) {
    throw badRequest(
      `q must be between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters`,
    );
  }
  const terms = parseSearchTerms(phrase);
  if (terms.length === 0) {
    throw badRequest("q must contain at least one search term");
  }
  // market_id is required so prices are never mixed across
  // markets/currencies - same rule as /products/:id/comparison.
  const marketId = requireUuid(query, "market_id");
  const categoryId = optionalUuid(query, "category_id");

  const { rows, total } = await searchProducts(
    { terms, phrase, marketId, categoryId },
    limit,
    offset,
  );

  const config = DEFAULT_PRICE_INTELLIGENCE_CONFIG.priceStatus;
  const observations = await listObservationsForProducts(
    marketId,
    rows.map((row) => row.product_id),
    config.windowDays,
    config.includeFixtureData,
  );

  // Group observations per (product, merchant): the price status of a
  // result compares its best offer with that same merchant's history.
  const byKey = new Map<string, PriceObservation[]>();
  for (const obs of observations) {
    const key = `${obs.product_id}:${obs.merchant_id}`;
    const list = byKey.get(key) ?? [];
    list.push({
      price: Number(obs.price),
      observedAt: obs.observed_at,
      isFixture: obs.is_fixture,
    });
    byKey.set(key, list);
  }

  return {
    rows: rows.map((row) => toResult(row, byKey, config)),
    total,
  };
}

function toResult(
  row: ProductSearchRow,
  observationsByKey: Map<string, PriceObservation[]>,
  config: typeof DEFAULT_PRICE_INTELLIGENCE_CONFIG.priceStatus,
): ProductSearchResult {
  const price = Number(row.best_price);
  const status = computePriceStatus(
    price,
    observationsByKey.get(`${row.product_id}:${row.best_merchant_id}`) ?? [],
    config,
  );
  return {
    product_id: row.product_id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    image_url: row.image_url,
    category_id: row.category_id,
    offer_count: row.offer_count,
    best_offer: {
      offer_id: row.best_offer_id,
      merchant: {
        merchant_id: row.best_merchant_id,
        name: row.best_merchant_name,
        slug: row.best_merchant_slug,
      },
      price,
      original_price:
        row.best_original_price === null ? null : Number(row.best_original_price),
      currency: row.best_currency,
      availability_status: row.best_availability_status,
      is_fixture: row.best_is_fixture,
    },
    price_status: {
      status: status.status,
      verdict: status.verdict,
      difference_pct: status.differencePct,
      observation_count: status.observationCount,
    },
  };
}
