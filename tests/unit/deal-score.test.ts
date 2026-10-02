import { describe, expect, it } from "vitest";
import {
  computeDealScore,
  type DealScoreInput,
} from "../../src/deal/intelligence/deal-score.js";
import {
  DEFAULT_PRICE_INTELLIGENCE_CONFIG,
  resolvePriceIntelligenceConfig,
} from "../../src/deal/intelligence/intelligence.config.js";
import type { PriceObservation } from "../../src/deal/intelligence/price-status.js";

const NOW = new Date("2026-09-30T12:00:00Z");
const DAY = 86_400_000;
const HOUR = 3_600_000;

function history(count: number, price: number): PriceObservation[] {
  return Array.from({ length: count }, (_, i) => ({
    price,
    observedAt: new Date(NOW.getTime() - (i + 1) * DAY),
  }));
}

/** A strong deal: 20% below a flat 100 history, in stock, fresh, 3 stores. */
function strongDeal(overrides: Partial<DealScoreInput> = {}): DealScoreInput {
  return {
    currentPrice: 80,
    originalPrice: 100,
    observations: history(10, 100),
    offerCount: 3,
    availability: "in_stock",
    hasCouponOrOffer: false,
    offerUpdatedAt: new Date(NOW.getTime() - HOUR),
    ...overrides,
  };
}

const config = DEFAULT_PRICE_INTELLIGENCE_CONFIG;

describe("computeDealScore", () => {
  it("scores a clear deal highly and explains why", () => {
    const result = computeDealScore(strongDeal(), config, NOW);
    // 30 + 20 + (10 * 20/30) + 0 + 10 + 10 + 10 = 86.67 => 87
    expect(result.score).toBe(87);
    expect(result.rating).toBe("great");
    expect(result.confidence).toBe("high");
    expect(result.reasons).toContain("20% below 30-day average");
    expect(result.reasons).toContain("At the lowest price in the last 30 days");
    expect(result.reasons).toContain("Offer data is fresh");
    expect(result.reasons).toContain("In stock");
  });

  it("scores a price above average poorly", () => {
    const result = computeDealScore(
      strongDeal({ currentPrice: 120, originalPrice: null }),
      config,
      NOW,
    );
    expect(result.score).not.toBeNull();
    expect(result.score as number).toBeLessThan(60);
    expect(result.reasons).toContain("20% above 30-day average");
  });

  it("returns no score when there is no price evidence at all", () => {
    const result = computeDealScore(
      strongDeal({ observations: [], originalPrice: null }),
      config,
      NOW,
    );
    expect(result.score).toBeNull();
    expect(result.rating).toBe("unrated");
    expect(result.confidence).toBe("none");
    expect(result.reasons).toEqual(["Not enough price data to score this deal yet"]);
  });

  it("caps the score when there is no usable price history", () => {
    const result = computeDealScore(strongDeal({ observations: [] }), config, NOW);
    expect(result.score).not.toBeNull();
    expect(result.score as number).toBeLessThanOrEqual(
      config.dealScore.maxScoreWithoutPriceHistory,
    );
    expect(result.reasons).toContain("Price history is still building");
    expect(result.confidence).not.toBe("high");
  });

  it("caps the score when the product is out of stock", () => {
    const result = computeDealScore(
      strongDeal({ availability: "out_of_stock" }),
      config,
      NOW,
    );
    expect(result.score as number).toBeLessThanOrEqual(
      config.dealScore.outOfStockScoreCap,
    );
    expect(result.reasons).toContain("Currently out of stock");
  });

  it("lowers the score for stale offer data", () => {
    const fresh = computeDealScore(strongDeal(), config, NOW);
    const stale = computeDealScore(
      strongDeal({ offerUpdatedAt: new Date(NOW.getTime() - 10 * DAY) }),
      config,
      NOW,
    );
    expect(stale.score as number).toBeLessThan(fresh.score as number);
    expect(stale.reasons).toContain("Offer data may be out of date");
  });

  it("leaves out unknown signals instead of treating them as bad", () => {
    const known = computeDealScore(strongDeal(), config, NOW);
    const unknown = computeDealScore(
      strongDeal({
        hasCouponOrOffer: null,
        availability: "unknown",
        offerUpdatedAt: null,
      }),
      config,
      NOW,
    );
    const couponSignal = unknown.signals.find((s) => s.key === "couponOrOffer");
    expect(couponSignal?.value).toBeNull();
    expect(unknown.score as number).toBeGreaterThanOrEqual(known.score as number);
    expect(unknown.confidence).not.toBe("high");
  });

  it("honours configurable weights", () => {
    const noCouponWeight = resolvePriceIntelligenceConfig({
      dealScore: { weights: { couponOrOffer: 0 } },
    });
    const defaultScore = computeDealScore(strongDeal(), config, NOW).score as number;
    const customScore = computeDealScore(strongDeal(), noCouponWeight, NOW)
      .score as number;
    expect(customScore).toBeGreaterThan(defaultScore);
  });

  it("rewards an available coupon/offer", () => {
    const without = computeDealScore(strongDeal(), config, NOW).score as number;
    const withOffer = computeDealScore(
      strongDeal({ hasCouponOrOffer: true }),
      config,
      NOW,
    );
    expect(withOffer.score as number).toBeGreaterThan(without);
    expect(withOffer.reasons).toContain("Offer or coupon available");
  });

  it("never claims a deal is verified", () => {
    const result = computeDealScore(strongDeal(), config, NOW);
    expect(result.reasons.join(" ")).not.toMatch(/verified/i);
  });

  it("keeps the score within 0-100", () => {
    const best = computeDealScore(
      strongDeal({ currentPrice: 1, hasCouponOrOffer: true }),
      config,
      NOW,
    );
    const worst = computeDealScore(
      strongDeal({
        currentPrice: 500,
        originalPrice: 100,
        availability: "out_of_stock",
        offerCount: 0,
      }),
      config,
      NOW,
    );
    expect(best.score as number).toBeLessThanOrEqual(100);
    expect(worst.score as number).toBeGreaterThanOrEqual(0);
  });
});

describe("resolvePriceIntelligenceConfig", () => {
  it("returns the defaults when no overrides are given", () => {
    expect(resolvePriceIntelligenceConfig()).toEqual(
      DEFAULT_PRICE_INTELLIGENCE_CONFIG,
    );
  });

  it("rejects negative weights", () => {
    expect(() =>
      resolvePriceIntelligenceConfig({ dealScore: { weights: { vsAverage: -1 } } }),
    ).toThrow(/vsAverage/);
  });

  it("rejects all-zero weights", () => {
    expect(() =>
      resolvePriceIntelligenceConfig({
        dealScore: {
          weights: {
            vsAverage: 0,
            nearMinimum: 0,
            priceReduction: 0,
            couponOrOffer: 0,
            stock: 0,
            freshness: 0,
            merchantCoverage: 0,
          },
        },
      }),
    ).toThrow(/weights/);
  });

  it("rejects staleHours that is not greater than freshHours", () => {
    expect(() =>
      resolvePriceIntelligenceConfig({
        dealScore: { staleHours: 10, freshHours: 24 },
      }),
    ).toThrow(/staleHours/);
  });
});
