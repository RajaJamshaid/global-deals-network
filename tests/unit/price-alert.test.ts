import { describe, expect, it } from "vitest";
import {
  isTargetReached,
  pickUsableOffer,
  type PricedOffer,
} from "../../src/alert/price-alert.service.js";

function offer(overrides: Partial<PricedOffer> & { offer_id: string; price: number }): PricedOffer {
  return { availability_status: "in_stock", is_fixture: false, ...overrides };
}

describe("isTargetReached", () => {
  it("is true when the effective price is at or below the target", () => {
    expect(isTargetReached(85, 90)).toBe(true);
    expect(isTargetReached(90, 90)).toBe(true);
    expect(isTargetReached(0, 90)).toBe(true);
  });

  it("is false when the effective price is above the target", () => {
    expect(isTargetReached(90.01, 90)).toBe(false);
    expect(isTargetReached(100, 90)).toBe(false);
  });

  it("is false without a usable price or a valid target", () => {
    expect(isTargetReached(null, 90)).toBe(false);
    expect(isTargetReached(undefined, 90)).toBe(false);
    expect(isTargetReached(85, null)).toBe(false);
    expect(isTargetReached(85, undefined)).toBe(false);
    expect(isTargetReached(85, 0)).toBe(false);
    expect(isTargetReached(85, -5)).toBe(false);
    expect(isTargetReached(Number.NaN, 90)).toBe(false);
    expect(isTargetReached(85, Number.POSITIVE_INFINITY)).toBe(false);
    expect(isTargetReached(-1, 90)).toBe(false);
  });

  it("compares in whole cents so floating point noise never decides an alert", () => {
    expect(isTargetReached(0.1 + 0.2, 0.3)).toBe(true);
    expect(isTargetReached(99.99, 99.99)).toBe(true);
  });
});

describe("pickUsableOffer", () => {
  it("picks the cheapest in-stock offer by effective price", () => {
    const result = pickUsableOffer([
      offer({ offer_id: "a", price: 99.99 }),
      offer({ offer_id: "b", price: 94.99 }),
      offer({ offer_id: "c", price: 102 }),
    ]);
    expect(result).toEqual({ offerId: "b", listedPrice: 94.99, effectivePrice: 94.99 });
  });

  it("ignores out-of-stock offers even when they are cheapest", () => {
    const result = pickUsableOffer([
      offer({ offer_id: "cheap", price: 1, availability_status: "out_of_stock" }),
      offer({ offer_id: "real", price: 80 }),
    ]);
    expect(result?.offerId).toBe("real");
  });

  it("treats unknown availability as available", () => {
    const result = pickUsableOffer([
      offer({ offer_id: "u", price: 50, availability_status: "unknown" }),
    ]);
    expect(result?.offerId).toBe("u");
  });

  it("never uses fixture (sample) offers", () => {
    const result = pickUsableOffer([
      offer({ offer_id: "sample", price: 1, is_fixture: true }),
      offer({ offer_id: "real", price: 80 }),
    ]);
    expect(result?.offerId).toBe("real");
    expect(pickUsableOffer([offer({ offer_id: "sample", price: 1, is_fixture: true })])).toBeNull();
  });

  it("returns null when there is no usable offer", () => {
    expect(pickUsableOffer([])).toBeNull();
    expect(
      pickUsableOffer([offer({ offer_id: "x", price: 5, availability_status: "out_of_stock" })]),
    ).toBeNull();
    expect(pickUsableOffer([offer({ offer_id: "bad", price: Number.NaN })])).toBeNull();
  });
});
