import { describe, expect, it } from "vitest";
import {
  computeEffectivePrice,
  rankOffersByEffectivePrice,
  type PriceAdjustment,
} from "../../src/deal/intelligence/effective-price.js";

describe("computeEffectivePrice", () => {
  it("equals the listed price when there are no adjustments", () => {
    const result = computeEffectivePrice(799);
    expect(result.effectivePrice).toBe(799);
    expect(result.totalDiscount).toBe(0);
    expect(result.appliedAdjustments).toEqual([]);
  });

  it("applies a verified fixed-amount coupon", () => {
    const result = computeEffectivePrice(100, [
      { type: "coupon", amount: 15, verified: true, source: "provider-a" },
    ]);
    expect(result.effectivePrice).toBe(85);
    expect(result.totalDiscount).toBe(15);
    expect(result.appliedAdjustments).toHaveLength(1);
  });

  it("applies a verified percentage discount to the listed price", () => {
    const result = computeEffectivePrice(200, [
      { type: "discount", percent: 10, verified: true, source: "provider-a" },
    ]);
    expect(result.effectivePrice).toBe(180);
  });

  it("never applies unverified adjustments", () => {
    const result = computeEffectivePrice(100, [
      { type: "coupon", amount: 50, verified: false, source: "scraped" },
      { type: "cashback", percent: 20, verified: false, source: "scraped" },
    ]);
    expect(result.effectivePrice).toBe(100);
    expect(result.appliedAdjustments).toEqual([]);
  });

  it("ignores malformed adjustments", () => {
    const malformed: PriceAdjustment[] = [
      { type: "coupon", amount: -5, verified: true, source: "x" },
      { type: "discount", percent: 150, verified: true, source: "x" },
      { type: "discount", verified: true, source: "x" },
    ];
    const result = computeEffectivePrice(100, malformed);
    expect(result.effectivePrice).toBe(100);
    expect(result.appliedAdjustments).toEqual([]);
  });

  it("never goes below zero", () => {
    const result = computeEffectivePrice(20, [
      { type: "coupon", amount: 50, verified: true, source: "x" },
    ]);
    expect(result.effectivePrice).toBe(0);
    expect(result.totalDiscount).toBe(20);
  });

  it("rejects an invalid listed price", () => {
    expect(() => computeEffectivePrice(-1)).toThrow(RangeError);
    expect(() => computeEffectivePrice(Number.NaN)).toThrow(RangeError);
  });
});

describe("rankOffersByEffectivePrice", () => {
  it("ranks the lowest effective price first", () => {
    const ranked = rankOffersByEffectivePrice([
      { offerId: "a", listedPrice: 799, inStock: true },
      { offerId: "b", listedPrice: 789, inStock: true },
      { offerId: "c", listedPrice: 799, inStock: true },
    ]);
    expect(ranked.map((r) => r.offerId)).toEqual(["b", "a", "c"]);
    expect(ranked[0]?.rank).toBe(1);
  });

  it("uses verified adjustments when ranking", () => {
    const ranked = rankOffersByEffectivePrice([
      { offerId: "a", listedPrice: 100, inStock: true },
      {
        offerId: "b",
        listedPrice: 110,
        inStock: true,
        adjustments: [{ type: "coupon", amount: 20, verified: true, source: "x" }],
      },
    ]);
    expect(ranked[0]?.offerId).toBe("b");
    expect(ranked[0]?.effectivePrice).toBe(90);
  });

  it("ranks out-of-stock offers after in-stock ones", () => {
    const ranked = rankOffersByEffectivePrice([
      { offerId: "cheap-oos", listedPrice: 50, inStock: false },
      { offerId: "pricier", listedPrice: 80, inStock: true },
    ]);
    expect(ranked.map((r) => r.offerId)).toEqual(["pricier", "cheap-oos"]);
  });

  it("breaks ties deterministically", () => {
    const ranked = rankOffersByEffectivePrice([
      { offerId: "z", listedPrice: 10, inStock: true },
      { offerId: "a", listedPrice: 10, inStock: true },
    ]);
    expect(ranked.map((r) => r.offerId)).toEqual(["a", "z"]);
  });

  it("returns an empty list for no offers", () => {
    expect(rankOffersByEffectivePrice([])).toEqual([]);
  });
});
