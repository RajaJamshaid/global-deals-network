import type { PriceStatusConfig } from "./intelligence.config.js";

/**
 * Price status (LOW / NORMAL / HIGH / NOT ENOUGH DATA).
 *
 * Pure functions over real stored observations - nothing is invented.
 * Thresholds come from PriceStatusConfig, never from the caller's UI.
 * Fixture/mock observations are excluded unless the config says
 * otherwise, so fixture data can't masquerade as real price history.
 */

export type PriceStatus = "low" | "normal" | "high" | "not_enough_data";
export type PriceVerdict =
  | "strong_deal"
  | "fair_price"
  | "wait"
  | "insufficient_data";

export interface PriceObservation {
  price: number;
  observedAt: Date | string;
  isFixture?: boolean;
}

export interface PriceStatusResult {
  status: PriceStatus;
  verdict: PriceVerdict;
  currentPrice: number | null;
  /** Window stats; null when there is not enough data. */
  averagePrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  /** (current - average) / average * 100, 1 decimal. Negative = below average. */
  differencePct: number | null;
  observationCount: number;
  windowDays: number;
}

const MS_PER_DAY = 86_400_000;

function toTimestamp(value: Date | string): number {
  return value instanceof Date ? value.getTime() : Date.parse(value);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function verdictForStatus(status: PriceStatus): PriceVerdict {
  switch (status) {
    case "low":
      return "strong_deal";
    case "high":
      return "wait";
    case "normal":
      return "fair_price";
    default:
      return "insufficient_data";
  }
}

/** Observations that are valid, inside the window, and allowed by config. */
export function selectWindowObservations(
  observations: readonly PriceObservation[],
  config: PriceStatusConfig,
  now: Date,
): PriceObservation[] {
  const end = now.getTime();
  const start = end - config.windowDays * MS_PER_DAY;
  return observations.filter((o) => {
    if (!Number.isFinite(o.price) || o.price < 0) return false;
    if (o.isFixture && !config.includeFixtureData) return false;
    const ts = toTimestamp(o.observedAt);
    return Number.isFinite(ts) && ts >= start && ts <= end;
  });
}

function notEnoughData(
  currentPrice: number,
  observationCount: number,
  config: PriceStatusConfig,
): PriceStatusResult {
  return {
    status: "not_enough_data",
    verdict: "insufficient_data",
    currentPrice: Number.isFinite(currentPrice) ? currentPrice : null,
    averagePrice: null,
    minPrice: null,
    maxPrice: null,
    differencePct: null,
    observationCount,
    windowDays: config.windowDays,
  };
}

/**
 * Compares the current price with the window average. `observations`
 * is the stored history (normally including the latest observation).
 */
export function computePriceStatus(
  currentPrice: number,
  observations: readonly PriceObservation[],
  config: PriceStatusConfig,
  now: Date = new Date(),
): PriceStatusResult {
  const inWindow = selectWindowObservations(observations, config, now);

  if (!Number.isFinite(currentPrice) || currentPrice < 0) {
    return notEnoughData(currentPrice, inWindow.length, config);
  }

  const distinctDays = new Set(
    inWindow.map((o) => Math.floor(toTimestamp(o.observedAt) / MS_PER_DAY)),
  ).size;

  if (
    inWindow.length < config.minObservations ||
    distinctDays < config.minDistinctDays
  ) {
    return notEnoughData(currentPrice, inWindow.length, config);
  }

  const prices = inWindow.map((o) => o.price);
  const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  if (average <= 0) {
    return notEnoughData(currentPrice, inWindow.length, config);
  }

  const differencePct = ((currentPrice - average) / average) * 100;
  let status: PriceStatus = "normal";
  if (differencePct <= -config.lowThresholdPct) {
    status = "low";
  } else if (differencePct >= config.highThresholdPct) {
    status = "high";
  }

  return {
    status,
    verdict: verdictForStatus(status),
    currentPrice,
    averagePrice: round(average, 2),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    differencePct: round(differencePct, 1),
    observationCount: inWindow.length,
    windowDays: config.windowDays,
  };
}
