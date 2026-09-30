import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICE_INTELLIGENCE_CONFIG,
  resolvePriceIntelligenceConfig,
} from "../../src/deal/intelligence/intelligence.config.js";
import {
  computePriceStatus,
  verdictForStatus,
  type PriceObservation,
} from "../../src/deal/intelligence/price-status.js";

const NOW = new Date("2026-09-30T12:00:00Z");
const DAY = 86_400_000;
const HOUR = 3_600_000;
const config = DEFAULT_PRICE_INTELLIGENCE_CONFIG.priceStatus;

/** `count` observations at `price`, one per day, starting 1 day ago. */
function dailyObservations(
  count: number,
  price: number,
  startDaysAgo = 1,
  isFixture = false,
): PriceObservation[] {
  return Array.from({ length: count }, (_, i) => ({
    price,
    observedAt: new Date(NOW.getTime() - (startDaysAgo + i) * DAY),
    isFixture,
  }));
}

describe("computePriceStatus", () => {
  it("returns NORMAL when the current price matches the average", () => {
    const result = computePriceStatus(100, dailyObservations(10, 100), config, NOW);
    expect(result.status).toBe("normal");
    expect(result.averagePrice).toBe(100);
    expect(result.differencePct).toBe(0);
    expect(result.verdict).toBe("fair_price");
  });

  it("returns LOW when the current price is well below the average", () => {
    const result = computePriceStatus(80, dailyObservations(10, 100), config, NOW);
    expect(result.status).toBe("low");
    expect(result.differencePct).toBe(-20);
    expect(result.minPrice).toBe(100);
    expect(result.verdict).toBe("strong_deal");
  });

  it("returns HIGH when the current price is well above the average", () => {
    const result = computePriceStatus(120, dailyObservations(10, 100), config, NOW);
    expect(result.status).toBe("high");
    expect(result.differencePct).toBe(20);
    expect(result.verdict).toBe("wait");
  });

  it("returns NOT ENOUGH DATA with too few observations", () => {
    const result = computePriceStatus(80, dailyObservations(3, 100), config, NOW);
    expect(result.status).toBe("not_enough_data");
    expect(result.averagePrice).toBeNull();
    expect(result.differencePct).toBeNull();
    expect(result.verdict).toBe("insufficient_data");
  });

  it("returns NOT ENOUGH DATA with no observations at all", () => {
    const result = computePriceStatus(80, [], config, NOW);
    expect(result.status).toBe("not_enough_data");
    expect(result.observationCount).toBe(0);
  });

  it("returns NOT ENOUGH DATA when observations cover too few days", () => {
    // 6 observations, all within the same UTC day.
    const sameDay: PriceObservation[] = Array.from({ length: 6 }, (_, i) => ({
      price: 100,
      observedAt: new Date(NOW.getTime() - (i + 1) * HOUR),
    }));
    const result = computePriceStatus(80, sameDay, config, NOW);
    expect(result.status).toBe("not_enough_data");
  });

  it("ignores observations outside the window", () => {
    const observations = [
      ...dailyObservations(10, 100),
      ...dailyObservations(5, 10, 60), // 60+ days ago: outside the 30-day window
    ];
    const result = computePriceStatus(100, observations, config, NOW);
    expect(result.status).toBe("normal");
    expect(result.averagePrice).toBe(100);
    expect(result.observationCount).toBe(10);
  });

  it("ignores future-dated observations", () => {
    const future: PriceObservation[] = [
      { price: 1, observedAt: new Date(NOW.getTime() + DAY) },
    ];
    const result = computePriceStatus(
      100,
      [...dailyObservations(10, 100), ...future],
      config,
      NOW,
    );
    expect(result.observationCount).toBe(10);
  });

  it("ignores fixture observations by default", () => {
    const fixtures = dailyObservations(10, 100, 1, true);
    const result = computePriceStatus(100, fixtures, config, NOW);
    expect(result.status).toBe("not_enough_data");
  });

  it("uses fixture observations only when config explicitly allows it", () => {
    const fixtures = dailyObservations(10, 100, 1, true);
    const result = computePriceStatus(
      100,
      fixtures,
      { ...config, includeFixtureData: true },
      NOW,
    );
    expect(result.status).toBe("normal");
  });

  it("ignores invalid prices and unparseable dates", () => {
    const junk: PriceObservation[] = [
      { price: Number.NaN, observedAt: new Date(NOW.getTime() - DAY) },
      { price: -5, observedAt: new Date(NOW.getTime() - DAY) },
      { price: 100, observedAt: "not-a-date" },
    ];
    const result = computePriceStatus(
      100,
      [...dailyObservations(10, 100), ...junk],
      config,
      NOW,
    );
    expect(result.observationCount).toBe(10);
  });

  it("accepts ISO string timestamps", () => {
    const observations: PriceObservation[] = dailyObservations(10, 100).map(
      (o) => ({ ...o, observedAt: new Date(o.observedAt).toISOString() }),
    );
    const result = computePriceStatus(100, observations, config, NOW);
    expect(result.status).toBe("normal");
  });

  it("respects configurable thresholds", () => {
    const observations = dailyObservations(10, 100);
    // 4% below average: NORMAL with the default 7% threshold...
    expect(computePriceStatus(96, observations, config, NOW).status).toBe("normal");
    // ...but LOW with a stricter 3% threshold.
    const strict = resolvePriceIntelligenceConfig({
      priceStatus: { lowThresholdPct: 3 },
    }).priceStatus;
    expect(computePriceStatus(96, observations, strict, NOW).status).toBe("low");
  });

  it("returns NOT ENOUGH DATA for an invalid current price", () => {
    const result = computePriceStatus(
      Number.NaN,
      dailyObservations(10, 100),
      config,
      NOW,
    );
    expect(result.status).toBe("not_enough_data");
    expect(result.currentPrice).toBeNull();
  });
});

describe("verdictForStatus", () => {
  it("maps each status to a verdict", () => {
    expect(verdictForStatus("low")).toBe("strong_deal");
    expect(verdictForStatus("normal")).toBe("fair_price");
    expect(verdictForStatus("high")).toBe("wait");
    expect(verdictForStatus("not_enough_data")).toBe("insufficient_data");
  });
});
