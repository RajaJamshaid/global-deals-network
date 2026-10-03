import { notFound } from "../api/http/errors.js";
import { env } from "../config/env.js";
import {
  computeDealScore,
  type DealScoreResult,
} from "../deal/intelligence/deal-score.js";
import {
  rankOffersByEffectivePrice,
  type PriceAdjustment,
} from "../deal/intelligence/effective-price.js";
import { DEFAULT_PRICE_INTELLIGENCE_CONFIG } from "../deal/intelligence/intelligence.config.js";
import {
  computePriceStatus,
  type PriceObservation,
  type PriceStatus,
  type PriceVerdict,
} from "../deal/intelligence/price-status.js";
import { getMarketById } from "../market/market.repository.js";
import { getCategoryById } from "./category.repository.js";
import { listPriceHistory } from "./price-history.repository.js";
import { PRICE_HISTORY_BUILDING_MESSAGE } from "./price-history.service.js";
import {
  getProductComparisonService,
  type ComparisonOfferEntry,
} from "./product-comparison.service.js";
import type { ProductRow } from "./product.repository.js";

/**
 * Product intelligence (Phase 1, Commit 5) - the product-detail
 * response the future Mini App consumes. This service only COMPOSES
 * existing pieces; it adds no pricing or scoring algorithm of its own:
 *   - offers / merchants / deals      -> getProductComparisonService
 *   - ordering + effective price      -> rankOffersByEffectivePrice
 *   - price status                    -> computePriceStatus
 *   - Deal Score                      -> computeDealScore
 *   - observations                    -> listPriceHistory (fixtures excluded
 *                                        unless the config allows them)
 *
 * Price status and Deal Score describe the BEST offer (rank 1: in-stock
 * first, then lowest effective price) compared with that same
 * merchant's own stored history in this market.
 *
 * Nothing is invented: shipping, coupons, cashback, ratings, reviews
 * and buyer counts do not exist in the data model, so they are
 * returned as null / reported in data_availability.
 */

export interface ProductIntelligenceOffer {
  /** 1 = best offer. In-stock first, then lowest effective price. */
  rank: number;
  offer_id: string;
  merchant: { merchant_id: string; name: string; slug: string } | null;
  listed_price: number;
  currency: string;
  effective_price: number;
  total_discount: number;
  applied_adjustments: PriceAdjustment[];
  original_price: number | null;
  condition: string;
  availability_status: string;
  /** Unknown availability counts as available (same convention as the ranking). */
  in_stock: boolean;
  /** true = sample/test offer, never live merchant pricing. */
  is_fixture: boolean;
  affiliate_available: boolean;
  /**
   * CTAs must go through the central Affiliate Engine redirect, so the
   * raw merchant URL is not exposed here. Null when the offer has no
   * active deal to redirect through.
   */
  deal_id: string | null;
  redirect_path: string | null;
  updated_at: string;
  /** Not available in the data model yet. */
  shipping: null;
  coupon: null;
  cashback: null;
}

export interface ProductIntelligenceResult extends ProductRow {
  category: { category_id: string; name: string; slug: string } | null;
  market: { market_id: string; code: string; name: string; currency: string };
  offer_count: number;
  best_offer_id: string | null;
  /** Effective price of the best offer; equals its listed price unless a verified adjustment exists. */
  effective_price: {
    listed_price: number;
    effective_price: number;
    total_discount: number;
    currency: string;
    applied_adjustments: PriceAdjustment[];
  } | null;
  offers: ProductIntelligenceOffer[];
  availability: {
    any_in_stock: boolean;
    in_stock_offer_count: number;
    out_of_stock_offer_count: number;
    unknown_offer_count: number;
  };
  price_status: {
    status: PriceStatus;
    verdict: PriceVerdict;
    current_price: number | null;
    average_price: number | null;
    min_price: number | null;
    max_price: number | null;
    difference_pct: number | null;
    observation_count: number;
    window_days: number;
    /** The offer this status describes (the best offer), if any. */
    scored_offer_id: string | null;
    message: string | null;
  };
  deal_score: DealScoreResult & { scored_offer_id: string | null };
  /** Which optional data exists. False = not available, never estimated. */
  data_availability: {
    shipping: false;
    coupons: false;
    cashback: false;
    ratings: false;
    reviews: false;
    buyer_counts: false;
  };
}

function unrated(reason: string): DealScoreResult {
  return {
    score: null,
    rating: "unrated",
    confidence: "none",
    reasons: [reason],
    signals: [],
  };
}

function normalizeAvailability(
  status: string,
): "in_stock" | "out_of_stock" | "unknown" {
  return status === "in_stock" || status === "out_of_stock" ? status : "unknown";
}

export async function getProductIntelligenceService(
  productId: string,
  marketId: string,
): Promise<ProductIntelligenceResult> {
  const market = await getMarketById(marketId);
  if (!market) {
    throw notFound("Market");
  }

  // Throws a standard 404 if the product does not exist.
  const { product, offers: entries } = await getProductComparisonService(
    productId,
    marketId,
  );

  const category = product.category_id
    ? await getCategoryById(product.category_id)
    : null;

  const ranked = rankOffersByEffectivePrice(
    entries.map((entry) => ({
      offerId: entry.offer.offer_id,
      listedPrice: Number(entry.offer.price),
      inStock: entry.offer.availability_status !== "out_of_stock",
      // No verified coupon/cashback provider exists yet, so no adjustments.
      adjustments: [],
    })),
  );

  const entryById = new Map<string, ComparisonOfferEntry>(
    entries.map((entry) => [entry.offer.offer_id, entry]),
  );

  const offers: ProductIntelligenceOffer[] = ranked.flatMap((rankedOffer) => {
    const entry = entryById.get(rankedOffer.offerId);
    if (!entry) return [];
    const { offer, merchant, deal } = entry;
    return [
      {
        rank: rankedOffer.rank,
        offer_id: offer.offer_id,
        merchant: merchant
          ? {
              merchant_id: merchant.merchant_id,
              name: merchant.name,
              slug: merchant.slug,
            }
          : null,
        listed_price: rankedOffer.listedPrice,
        currency: offer.currency,
        effective_price: rankedOffer.effectivePrice,
        total_discount: rankedOffer.totalDiscount,
        applied_adjustments: rankedOffer.appliedAdjustments,
        original_price:
          offer.original_price === null ? null : Number(offer.original_price),
        condition: offer.condition,
        availability_status: offer.availability_status,
        in_stock: rankedOffer.inStock,
        is_fixture: offer.is_fixture,
        affiliate_available: entry.affiliate_available,
        deal_id: deal ? deal.deal_id : null,
        redirect_path: deal
          ? `/api/${env.apiVersion}/redirect/deal/${deal.deal_id}`
          : null,
        updated_at: offer.updated_at,
        shipping: null,
        coupon: null,
        cashback: null,
      },
    ];
  });

  const availabilityCounts = {
    in_stock: 0,
    out_of_stock: 0,
    unknown: 0,
  };
  for (const entry of entries) {
    availabilityCounts[normalizeAvailability(entry.offer.availability_status)] += 1;
  }

  const config = DEFAULT_PRICE_INTELLIGENCE_CONFIG;
  const bestOffer = offers[0];
  const bestEntry = bestOffer ? entryById.get(bestOffer.offer_id) : undefined;

  let priceStatusResult = computePriceStatus(
    Number.NaN,
    [],
    config.priceStatus,
  );
  let dealScore: DealScoreResult = unrated(
    "No active offers in this market",
  );

  if (bestOffer && bestEntry) {
    const rows = await listPriceHistory({
      productId,
      marketId,
      days: config.priceStatus.windowDays,
      merchantId: bestEntry.offer.merchant_id,
      includeFixtures: config.priceStatus.includeFixtureData,
    });
    const observations: PriceObservation[] = rows.map((row) => ({
      price: Number(row.price),
      observedAt: row.observed_at,
      isFixture: row.is_fixture,
    }));
    const currentPrice = bestOffer.listed_price;

    priceStatusResult = computePriceStatus(
      currentPrice,
      observations,
      config.priceStatus,
    );

    if (bestOffer.is_fixture && !config.priceStatus.includeFixtureData) {
      // Sample data is never scored as if it were a real deal.
      dealScore = unrated("Sample (fixture) offer - not scored");
    } else {
      dealScore = computeDealScore(
        {
          currentPrice,
          originalPrice: bestOffer.original_price,
          observations,
          offerCount: entries.length,
          availability: normalizeAvailability(bestOffer.availability_status),
          // No coupon/offer data exists yet: unknown, so it is left out of
          // the score rather than counted for or against the deal.
          hasCouponOrOffer: null,
          offerUpdatedAt: bestOffer.updated_at,
        },
        config,
      );
    }
  }

  const scoredOfferId = bestOffer ? bestOffer.offer_id : null;

  return {
    ...product,
    category: category
      ? {
          category_id: category.category_id,
          name: category.name,
          slug: category.slug,
        }
      : null,
    market: {
      market_id: market.market_id,
      code: market.code,
      name: market.name,
      currency: market.currency,
    },
    offer_count: offers.length,
    best_offer_id: scoredOfferId,
    effective_price: bestOffer
      ? {
          listed_price: bestOffer.listed_price,
          effective_price: bestOffer.effective_price,
          total_discount: bestOffer.total_discount,
          currency: bestOffer.currency,
          applied_adjustments: bestOffer.applied_adjustments,
        }
      : null,
    offers,
    availability: {
      any_in_stock: availabilityCounts.in_stock > 0,
      in_stock_offer_count: availabilityCounts.in_stock,
      out_of_stock_offer_count: availabilityCounts.out_of_stock,
      unknown_offer_count: availabilityCounts.unknown,
    },
    price_status: {
      status: priceStatusResult.status,
      verdict: priceStatusResult.verdict,
      current_price: priceStatusResult.currentPrice,
      average_price: priceStatusResult.averagePrice,
      min_price: priceStatusResult.minPrice,
      max_price: priceStatusResult.maxPrice,
      difference_pct: priceStatusResult.differencePct,
      observation_count: priceStatusResult.observationCount,
      window_days: priceStatusResult.windowDays,
      scored_offer_id: scoredOfferId,
      message:
        priceStatusResult.status === "not_enough_data"
          ? PRICE_HISTORY_BUILDING_MESSAGE
          : null,
    },
    deal_score: { ...dealScore, scored_offer_id: scoredOfferId },
    data_availability: {
      shipping: false,
      coupons: false,
      cashback: false,
      ratings: false,
      reviews: false,
      buyer_counts: false,
    },
  };
}
