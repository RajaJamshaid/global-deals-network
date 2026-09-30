/**
 * Price-intelligence configuration (Phase 1).
 *
 * Every threshold and weight used by price status and the Deal Score
 * lives here - nothing is hard-coded in the scoring functions or the
 * frontend. Defaults are conservative; callers can pass overrides to
 * resolvePriceIntelligenceConfig() (env/DB wiring can be added later
 * without touching the scoring logic).
 */

export interface PriceStatusConfig {
  /** How many days of history are used for average/min/max. */
  windowDays: number;
  /** Minimum observations inside the window before a status is given. */
  minObservations: number;
  /** Minimum distinct calendar days (UTC) covered by those observations. */
  minDistinctDays: number;
  /** Current price this % (or more) below the window average => LOW. */
  lowThresholdPct: number;
  /** Current price this % (or more) above the window average => HIGH. */
  highThresholdPct: number;
  /** Fixture/mock observations are ignored unless this is true (dev only). */
  includeFixtureData: boolean;
}

export interface DealScoreWeights {
  vsAverage: number;
  nearMinimum: number;
  priceReduction: number;
  couponOrOffer: number;
  stock: number;
  freshness: number;
  merchantCoverage: number;
}

export interface DealScoreConfig {
  weights: DealScoreWeights;
  /** Being this % below the window average earns the full vsAverage signal. */
  fullScoreBelowAveragePct: number;
  /** A price this % above the window minimum earns zero nearMinimum signal. */
  nearMinimumMaxGapPct: number;
  /** A reduction of this % vs the merchant-stated original price earns full signal. */
  fullScoreReductionPct: number;
  /** Offer data younger than this many hours counts as fully fresh. */
  freshHours: number;
  /** Offer data older than this many hours counts as fully stale. */
  staleHours: number;
  /** This many stores (or more) earns the full merchantCoverage signal. */
  fullScoreOfferCount: number;
  /** Score ceiling when the product is out of stock. */
  outOfStockScoreCap: number;
  /** Score ceiling when there is no usable price history (weaker evidence). */
  maxScoreWithoutPriceHistory: number;
  /** Within this % of the window minimum is described as "near the recent low". */
  nearLowWithinPct: number;
  ratingThresholds: { great: number; good: number; fair: number };
}

export interface PriceIntelligenceConfig {
  priceStatus: PriceStatusConfig;
  dealScore: DealScoreConfig;
}

export interface PriceIntelligenceConfigOverrides {
  priceStatus?: Partial<PriceStatusConfig>;
  dealScore?: Partial<Omit<DealScoreConfig, "weights">> & {
    weights?: Partial<DealScoreWeights>;
  };
}

export const DEFAULT_PRICE_INTELLIGENCE_CONFIG: PriceIntelligenceConfig = {
  priceStatus: {
    windowDays: 30,
    minObservations: 5,
    minDistinctDays: 3,
    lowThresholdPct: 7,
    highThresholdPct: 7,
    includeFixtureData: false,
  },
  dealScore: {
    weights: {
      vsAverage: 30,
      nearMinimum: 20,
      priceReduction: 10,
      couponOrOffer: 10,
      stock: 10,
      freshness: 10,
      merchantCoverage: 10,
    },
    fullScoreBelowAveragePct: 20,
    nearMinimumMaxGapPct: 15,
    fullScoreReductionPct: 30,
    freshHours: 24,
    staleHours: 168,
    fullScoreOfferCount: 3,
    outOfStockScoreCap: 40,
    maxScoreWithoutPriceHistory: 60,
    nearLowWithinPct: 2,
    ratingThresholds: { great: 80, good: 60, fair: 40 },
  },
};

function fail(message: string): never {
  throw new Error(`Invalid price-intelligence config: ${message}`);
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    fail(`${name} must be a positive number`);
  }
}

function assertNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    fail(`${name} must be a non-negative number`);
  }
}

function validate(config: PriceIntelligenceConfig): void {
  const ps = config.priceStatus;
  assertPositive("priceStatus.windowDays", ps.windowDays);
  assertPositive("priceStatus.lowThresholdPct", ps.lowThresholdPct);
  assertPositive("priceStatus.highThresholdPct", ps.highThresholdPct);
  if (!Number.isInteger(ps.minObservations) || ps.minObservations < 1) {
    fail("priceStatus.minObservations must be an integer >= 1");
  }
  if (!Number.isInteger(ps.minDistinctDays) || ps.minDistinctDays < 1) {
    fail("priceStatus.minDistinctDays must be an integer >= 1");
  }

  const ds = config.dealScore;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(ds.weights)) {
    assertNonNegative(`dealScore.weights.${key}`, weight);
    weightSum += weight;
  }
  if (weightSum <= 0) {
    fail("dealScore.weights must not all be zero");
  }
  assertPositive("dealScore.fullScoreBelowAveragePct", ds.fullScoreBelowAveragePct);
  assertPositive("dealScore.nearMinimumMaxGapPct", ds.nearMinimumMaxGapPct);
  assertPositive("dealScore.fullScoreReductionPct", ds.fullScoreReductionPct);
  assertPositive("dealScore.freshHours", ds.freshHours);
  assertPositive("dealScore.fullScoreOfferCount", ds.fullScoreOfferCount);
  assertNonNegative("dealScore.outOfStockScoreCap", ds.outOfStockScoreCap);
  assertNonNegative(
    "dealScore.maxScoreWithoutPriceHistory",
    ds.maxScoreWithoutPriceHistory,
  );
  assertNonNegative("dealScore.nearLowWithinPct", ds.nearLowWithinPct);
  if (!Number.isFinite(ds.staleHours) || ds.staleHours <= ds.freshHours) {
    fail("dealScore.staleHours must be greater than dealScore.freshHours");
  }
  const t = ds.ratingThresholds;
  if (!(t.great > t.good && t.good > t.fair && t.fair >= 0)) {
    fail("dealScore.ratingThresholds must satisfy great > good > fair >= 0");
  }
}

/** Merges overrides onto the defaults and validates the result. */
export function resolvePriceIntelligenceConfig(
  overrides: PriceIntelligenceConfigOverrides = {},
): PriceIntelligenceConfig {
  const { weights: weightOverrides, ...dealScoreOverrides } =
    overrides.dealScore ?? {};
  const defaults = DEFAULT_PRICE_INTELLIGENCE_CONFIG;

  const resolved: PriceIntelligenceConfig = {
    priceStatus: { ...defaults.priceStatus, ...overrides.priceStatus },
    dealScore: {
      ...defaults.dealScore,
      ...dealScoreOverrides,
      weights: { ...defaults.dealScore.weights, ...weightOverrides },
    },
  };
  validate(resolved);
  return resolved;
}
