import { badRequest, notFound } from "../api/http/errors.js";
import { optionalUuid, requireUuid } from "../api/http/validation.js";
import { DEFAULT_PRICE_INTELLIGENCE_CONFIG } from "../deal/intelligence/intelligence.config.js";
import { listPriceHistory } from "./price-history.repository.js";
import { getProductById } from "./product.repository.js";

export const PRICE_HISTORY_WINDOWS: readonly number[] = [7, 30, 90];
export const DEFAULT_PRICE_HISTORY_DAYS = 30;
export const PRICE_HISTORY_BUILDING_MESSAGE =
  "Price history is building as GDN collects more data.";

export interface PriceHistoryObservation {
  observed_at: string;
  price: number;
  currency: string;
  merchant_id: string;
  offer_id: string | null;
  source: string;
  /** true = sample/test data, never live merchant pricing. */
  is_fixture: boolean;
}

export interface PriceHistoryResult {
  product_id: string;
  market_id: string;
  days: number;
  include_fixtures: boolean;
  observations: PriceHistoryObservation[];
  /** Computed only from the returned observations; null when there are none. */
  summary: {
    observation_count: number;
    min_price: number;
    max_price: number;
    first_observed_at: string;
    last_observed_at: string;
  } | null;
  /** Set when there is too little history to draw conclusions. */
  message: string | null;
}

function parseDays(raw: unknown): number {
  if (raw === undefined || raw === null || raw === "") {
    return DEFAULT_PRICE_HISTORY_DAYS;
  }
  const days = Number(raw);
  if (!PRICE_HISTORY_WINDOWS.includes(days)) {
    throw badRequest(`days must be one of: ${PRICE_HISTORY_WINDOWS.join(", ")}`);
  }
  return days;
}

export async function getProductPriceHistoryService(
  productId: string,
  query: Record<string, unknown>,
): Promise<PriceHistoryResult> {
  const marketId = requireUuid(query, "market_id");
  const merchantId = optionalUuid(query, "merchant_id");
  const days = parseDays(query.days);
  const includeFixtures = query.include_fixtures === "true";

  const product = await getProductById(productId);
  if (!product) {
    throw notFound("Product");
  }

  const rows = await listPriceHistory({
    productId,
    marketId,
    days,
    merchantId,
    includeFixtures,
  });

  const observations: PriceHistoryObservation[] = rows.map((row) => ({
    observed_at: row.observed_at.toISOString(),
    price: Number(row.price),
    currency: row.currency,
    merchant_id: row.merchant_id,
    offer_id: row.offer_id,
    source: row.source,
    is_fixture: row.is_fixture,
  }));

  const first = observations[0];
  const last = observations[observations.length - 1];
  let summary: PriceHistoryResult["summary"] = null;
  if (first && last) {
    const prices = observations.map((o) => o.price);
    summary = {
      observation_count: observations.length,
      min_price: Math.min(...prices),
      max_price: Math.max(...prices),
      first_observed_at: first.observed_at,
      last_observed_at: last.observed_at,
    };
  }

  const minObservations =
    DEFAULT_PRICE_INTELLIGENCE_CONFIG.priceStatus.minObservations;
  return {
    product_id: productId,
    market_id: marketId,
    days,
    include_fixtures: includeFixtures,
    observations,
    summary,
    message:
      observations.length < minObservations
        ? PRICE_HISTORY_BUILDING_MESSAGE
        : null,
  };
}
