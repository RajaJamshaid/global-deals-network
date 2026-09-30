import type {
  DealScoreConfig,
  DealScoreWeights,
  PriceIntelligenceConfig,
} from "./intelligence.config.js";
import { DEFAULT_PRICE_INTELLIGENCE_CONFIG } from "./intelligence.config.js";
import {
  computePriceStatus,
  type PriceObservation,
} from "./price-status.js";

/**
 * GDN Deal Score (0-100) - transparent and explainable.
 *
 * Built only from measurable signals. Each signal is 0..1, or null
 * when the underlying data does not exist (null signals are left out
 * and the remaining weights are renormalized, so missing data never
 * counts as a bad or a good sign). Every weight and threshold comes
 * from config. The score never claims a deal is "verified".
 *
 * Safeguards:
 * - No price evidence at all (no history and no original price) =>
 *   score is null ("unrated"), not a made-up number.
 * - No usable price history => score is capped
 *   (maxScoreWithoutPriceHistory), because the evidence is weaker.
 * - Out of stock => score is capped (outOfStockScoreCap).
 */

export type DealSignalKey = keyof DealScoreWeights;
export type DealRating = "great" | "good" | "fair" | "weak" | "unrated";
export type DealConfidence = "high" | "medium" | "low" | "none";

export interface DealScoreInput {
  currentPrice: number;
  /** Merchant-stated original/list price, if any (not independently verified). */
  originalPrice?: number | null;
  observations: readonly PriceObservation[];
  offerCount: number;
  availability: "in_stock" | "out_of_stock" | "unknown";
  /** true/false when coupon/offer data is known; null when unknown. */
  hasCouponOrOffer: boolean | null;
  /** When the offer data was last updated. */
  offerUpdatedAt?: Date | string | null;
}

export interface DealSignal {
  key: DealSignalKey;
  weight: number;
  /** 0..1, or null when the data is not available. */
  value: number | null;
}

export interface DealScoreResult {
  score: number | null;
  rating: DealRating;
  confidence: DealConfidence;
  /** Short, factual bullets for the "Why this score?" panel. */
  reasons: string[];
  signals: DealSignal[];
}

const MS_PER_HOUR = 3_600_000;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function ratingFor(score: number, config: DealScoreConfig): DealRating {
  const t = config.ratingThresholds;
  if (score >= t.great) return "great";
  if (score >= t.good) return "good";
  if (score >= t.fair) return "fair";
  return "weak";
}

export function computeDealScore(
  input: DealScoreInput,
  config: PriceIntelligenceConfig = DEFAULT_PRICE_INTELLIGENCE_CONFIG,
  now: Date = new Date(),
): DealScoreResult {
  const ds = config.dealScore;
  const stats = computePriceStatus(
    input.currentPrice,
    input.observations,
    config.priceStatus,
    now,
  );
  const windowDays = config.priceStatus.windowDays;
  const hasHistory =
    stats.status !== "not_enough_data" &&
    stats.differencePct !== null &&
    stats.minPrice !== null;

  const reasons: string[] = [];

  // --- vsAverage ---
  let vsAverage: number | null = null;
  if (hasHistory && stats.differencePct !== null) {
    const diff = stats.differencePct;
    vsAverage = clamp01(-diff / ds.fullScoreBelowAveragePct);
    if (diff <= -1) {
      reasons.push(`${Math.round(-diff)}% below ${windowDays}-day average`);
    } else if (diff >= 1) {
      reasons.push(`${Math.round(diff)}% above ${windowDays}-day average`);
    } else {
      reasons.push(`Close to the ${windowDays}-day average`);
    }
  }

  // --- nearMinimum ---
  let nearMinimum: number | null = null;
  if (hasHistory && stats.minPrice !== null && stats.minPrice > 0) {
    if (input.currentPrice <= stats.minPrice) {
      nearMinimum = 1;
      reasons.push(`At the lowest price in the last ${windowDays} days`);
    } else {
      const gapPct =
        ((input.currentPrice - stats.minPrice) / stats.minPrice) * 100;
      nearMinimum = clamp01(1 - gapPct / ds.nearMinimumMaxGapPct);
      if (gapPct <= ds.nearLowWithinPct) {
        reasons.push("Near the recent low");
      }
    }
  }

  // --- priceReduction (vs merchant-stated original price) ---
  let priceReduction: number | null = null;
  const original = input.originalPrice;
  if (
    original !== null &&
    original !== undefined &&
    Number.isFinite(original) &&
    original > 0 &&
    Number.isFinite(input.currentPrice)
  ) {
    const reductionPct = ((original - input.currentPrice) / original) * 100;
    priceReduction = clamp01(reductionPct / ds.fullScoreReductionPct);
    if (reductionPct >= 1) {
      reasons.push(
        `${Math.round(reductionPct)}% below the merchant's listed original price`,
      );
    }
  }

  // --- couponOrOffer ---
  let couponOrOffer: number | null = null;
  if (input.hasCouponOrOffer !== null) {
    couponOrOffer = input.hasCouponOrOffer ? 1 : 0;
    if (input.hasCouponOrOffer) reasons.push("Offer or coupon available");
  }

  // --- stock ---
  let stock: number | null = null;
  if (input.availability === "in_stock") {
    stock = 1;
    reasons.push("In stock");
  } else if (input.availability === "out_of_stock") {
    stock = 0;
    reasons.push("Currently out of stock");
  }

  // --- freshness ---
  let freshness: number | null = null;
  if (input.offerUpdatedAt !== null && input.offerUpdatedAt !== undefined) {
    const ts =
      input.offerUpdatedAt instanceof Date
        ? input.offerUpdatedAt.getTime()
        : Date.parse(input.offerUpdatedAt);
    if (Number.isFinite(ts)) {
      const ageHours = (now.getTime() - ts) / MS_PER_HOUR;
      if (ageHours <= ds.freshHours) {
        freshness = 1;
        reasons.push("Offer data is fresh");
      } else if (ageHours >= ds.staleHours) {
        freshness = 0;
        reasons.push("Offer data may be out of date");
      } else {
        freshness =
          1 - (ageHours - ds.freshHours) / (ds.staleHours - ds.freshHours);
      }
    }
  }

  // --- merchantCoverage ---
  let merchantCoverage: number | null = null;
  if (Number.isFinite(input.offerCount) && input.offerCount >= 0) {
    merchantCoverage = clamp01(input.offerCount / ds.fullScoreOfferCount);
    if (input.offerCount >= 2) {
      reasons.push(`Available at ${input.offerCount} stores`);
    }
  }

  const values: Record<DealSignalKey, number | null> = {
    vsAverage,
    nearMinimum,
    priceReduction,
    couponOrOffer,
    stock,
    freshness,
    merchantCoverage,
  };
  const signals: DealSignal[] = (Object.keys(values) as DealSignalKey[]).map(
    (key) => ({ key, weight: ds.weights[key], value: values[key] }),
  );

  const hasPriceEvidence =
    vsAverage !== null || nearMinimum !== null || priceReduction !== null;
  if (!hasPriceEvidence) {
    return {
      score: null,
      rating: "unrated",
      confidence: "none",
      reasons: ["Not enough price data to score this deal yet"],
      signals,
    };
  }

  let totalWeight = 0;
  let availableWeight = 0;
  let weighted = 0;
  for (const signal of signals) {
    totalWeight += signal.weight;
    if (signal.value !== null) {
      availableWeight += signal.weight;
      weighted += signal.weight * signal.value;
    }
  }

  let score =
    availableWeight > 0 ? Math.round((weighted / availableWeight) * 100) : 0;

  if (!hasHistory) {
    score = Math.min(score, ds.maxScoreWithoutPriceHistory);
    reasons.push("Price history is still building");
  }
  if (stock === 0) {
    score = Math.min(score, ds.outOfStockScoreCap);
  }

  const coverage = totalWeight > 0 ? availableWeight / totalWeight : 0;
  const confidence: DealConfidence =
    coverage >= 0.75 ? "high" : coverage >= 0.5 ? "medium" : "low";

  return {
    score,
    rating: ratingFor(score, ds),
    confidence,
    reasons,
    signals,
  };
}
