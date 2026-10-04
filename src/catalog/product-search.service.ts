import { badRequest, notFound } from "../api/http/errors.js";
import { optionalUuid, requireUuid } from "../api/http/validation.js";
import { env } from "../config/env.js";
import { computeDealScore, type DealScoreResult } from "../deal/intelligence/deal-score.js";
import { rankOffersByEffectivePrice } from "../deal/intelligence/effective-price.js";
import { DEFAULT_PRICE_INTELLIGENCE_CONFIG } from "../deal/intelligence/intelligence.config.js";
import {
  computePriceStatus,
  type PriceObservation,
  type PriceStatus,
  type PriceVerdict,
} from "../deal/intelligence/price-status.js";
import { getMarketById } from "../market/market.repository.js";
import {
  listActiveOffersForProducts,
  type ActiveOfferRow,
} from "../offer/offer-batch.repository.js";
import { listObservationsForProducts } from "./price-history.repository.js";
import { searchProducts, type ProductSearchRow } from "./product-search.repository.js";
import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  parseSearchTerms,
} from "./search-query.js";

/**
 * Comparison-oriented text search. Each result carries what the UI needs
 * to start a price comparison: the product, the market, the best shown
 * price and its store, the number of offers, price status and (when there
 * is enough real evidence) the Deal Score. Opening a result goes to
 * GET /products/:id?market_id= (compare_path) - the same product
 * intelligence every other discovery method uses.
 *
 * No algorithm lives here: ranking is rankOffersByEffectivePrice, price
 * status is computePriceStatus and the score is computeDealScore. Three
 * queries serve a whole page of results (products, offers, observations).
 */
export interface ProductSearchResult {
  product_id: string;
  name: string;
  slug: string;
  brand: string | null;
  image_url: string | null;
  category_id: string | null;
  market: { market_id: string; code: string; name: string; currency: string };
  offer_count: number;
  /** Best active offer: in stock first, then lowest effective price. */
  best_offer: {
    offer_id: string;
    merchant: { merchant_id: string; name: string; slug: string };
    /** Listed price (kept for compatibility); see effective_price. */
    price: number;
    effective_price: number;
    original_price: number | null;
    currency: string;
    availability_status: string;
    in_stock: boolean;
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
  /** score is null unless there is real price evidence. */
  deal_score: {
    score: number | null;
    rating: DealScoreResult["rating"];
    confidence: DealScoreResult["confidence"];
    reasons: string[];
    scored_offer_id: string;
  };
  /** Open this to compare stores (full product intelligence for this market). */
  compare_path: string;
  /** Public, indexable product landing page. */
  page_path: string;
}

function normalizeAvailability(status: string): "in_stock" | "out_of_stock" | "unknown" {
  return status === "in_stock" || status === "out_of_stock" ? status : "unknown";
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
  // markets/currencies - same rule as the product intelligence endpoint.
  const marketId = requireUuid(query, "market_id");
  const categoryId = optionalUuid(query, "category_id");

  const market = await getMarketById(marketId);
  if (!market) {
    // "market unavailable" state
    throw notFound("Market");
  }

  const { rows, total } = await searchProducts(
    { terms, phrase, marketId, categoryId },
    limit,
    offset,
  );

  const productIds = rows.map((row) => row.product_id);
  const config = DEFAULT_PRICE_INTELLIGENCE_CONFIG;
  const [offerRows, observationRows] = await Promise.all([
    listActiveOffersForProducts(marketId, productIds),
    listObservationsForProducts(
      marketId,
      productIds,
      config.priceStatus.windowDays,
      config.priceStatus.includeFixtureData,
    ),
  ]);

  const offersByProduct = new Map<string, ActiveOfferRow[]>();
  for (const offer of offerRows) {
    const list = offersByProduct.get(offer.product_id) ?? [];
    list.push(offer);
    offersByProduct.set(offer.product_id, list);
  }
  // Observations per (product, merchant): a result's status compares its
  // best offer with that same merchant's own stored history.
  const observationsByKey = new Map<string, PriceObservation[]>();
  for (const obs of observationRows) {
    const key = `${obs.product_id}:${obs.merchant_id}`;
    const list = observationsByKey.get(key) ?? [];
    list.push({
      price: Number(obs.price),
      observedAt: obs.observed_at,
      isFixture: obs.is_fixture,
    });
    observationsByKey.set(key, list);
  }

  const results: ProductSearchResult[] = [];
  for (const row of rows) {
    const offers = offersByProduct.get(row.product_id) ?? [];
    const result = toResult(row, offers, observationsByKey, market);
    if (result) results.push(result);
  }
  return { rows: results, total };
}

function toResult(
  row: ProductSearchRow,
  offers: ActiveOfferRow[],
  observationsByKey: Map<string, PriceObservation[]>,
  market: { market_id: string; code: string; name: string; currency: string },
): ProductSearchResult | null {
  const config = DEFAULT_PRICE_INTELLIGENCE_CONFIG;
  const ranked = rankOffersByEffectivePrice(
    offers.map((offer) => ({
      offerId: offer.offer_id,
      listedPrice: Number(offer.price),
      inStock: offer.availability_status !== "out_of_stock",
    })),
  );
  const best = ranked[0];
  const bestOffer = best ? offers.find((offer) => offer.offer_id === best.offerId) : undefined;
  if (!best || !bestOffer) {
    // Offers vanished between the two queries; nothing to compare.
    return null;
  }

  const observations = observationsByKey.get(`${row.product_id}:${bestOffer.merchant_id}`) ?? [];
  const status = computePriceStatus(best.listedPrice, observations, config.priceStatus);

  let dealScore: DealScoreResult;
  if (bestOffer.is_fixture && !config.priceStatus.includeFixtureData) {
    // Sample data is never scored as if it were a real deal.
    dealScore = {
      score: null,
      rating: "unrated",
      confidence: "none",
      reasons: ["Sample (fixture) offer - not scored"],
      signals: [],
    };
  } else {
    dealScore = computeDealScore(
      {
        currentPrice: best.listedPrice,
        originalPrice: bestOffer.original_price === null ? null : Number(bestOffer.original_price),
        observations,
        offerCount: offers.length,
        availability: normalizeAvailability(bestOffer.availability_status),
        // No coupon/offer data exists yet: unknown, left out of the score.
        hasCouponOrOffer: null,
        offerUpdatedAt: bestOffer.updated_at,
      },
      config,
    );
  }

  return {
    product_id: row.product_id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    image_url: row.image_url,
    category_id: row.category_id,
    market,
    offer_count: offers.length,
    best_offer: {
      offer_id: bestOffer.offer_id,
      merchant: {
        merchant_id: bestOffer.merchant_id,
        name: bestOffer.merchant_name,
        slug: bestOffer.merchant_slug,
      },
      price: best.listedPrice,
      effective_price: best.effectivePrice,
      original_price: bestOffer.original_price === null ? null : Number(bestOffer.original_price),
      currency: bestOffer.currency,
      availability_status: bestOffer.availability_status,
      in_stock: best.inStock,
      is_fixture: bestOffer.is_fixture,
    },
    price_status: {
      status: status.status,
      verdict: status.verdict,
      difference_pct: status.differencePct,
      observation_count: status.observationCount,
    },
    deal_score: {
      score: dealScore.score,
      rating: dealScore.rating,
      confidence: dealScore.confidence,
      reasons: dealScore.reasons,
      scored_offer_id: bestOffer.offer_id,
    },
    compare_path: `/api/${env.apiVersion}/products/${row.product_id}?market_id=${market.market_id}`,
    page_path: `/product/${row.slug}`,
  };
}
