import { badRequest, notFound } from "../api/http/errors.js";
import { requireUuid } from "../api/http/validation.js";
import { isTargetReached, pickUsableOffer } from "../alert/price-alert.service.js";
import { getProductById } from "../catalog/product.repository.js";
import { listObservationsForProducts } from "../catalog/price-history.repository.js";
import { rankOffersByEffectivePrice } from "../deal/intelligence/effective-price.js";
import { DEFAULT_PRICE_INTELLIGENCE_CONFIG } from "../deal/intelligence/intelligence.config.js";
import {
  computePriceStatus,
  type PriceObservation,
} from "../deal/intelligence/price-status.js";
import { getMarketById } from "../market/market.repository.js";
import {
  deactivateWatch,
  listActiveOffersForProducts,
  listWatchlist,
  productHasOfferInMarket,
  upsertWatch,
  type ActiveOfferRow,
  type WatchRow,
} from "./watch.repository.js";

/** numeric(12,2) holds at most 9,999,999,999.99. */
const MAX_TARGET_PRICE = 9_999_999_999.99;

export interface WatchResponse {
  product_id: string;
  market_id: string | null;
  target_price: number | null;
  currency: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export function toWatchResponse(row: WatchRow): WatchResponse {
  return {
    product_id: row.product_id,
    market_id: row.market_id,
    target_price: row.target_price === null ? null : Number(row.target_price),
    currency: row.currency,
    active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Reads the optional target price from a request body.
 *   absent      -> undefined (leave an existing target untouched)
 *   null        -> null      (clear the target)
 *   a number    -> that number, rounded to cents, which must be > 0
 * Anything else (strings, zero, negatives, NaN-like, huge) is a 400.
 */
export function parseTargetPrice(
  body: Record<string, unknown>,
): number | null | undefined {
  const raw = body.target_price;
  if (raw === undefined) {
    return undefined;
  }
  if (raw === null) {
    return null;
  }
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw badRequest("target_price must be a number");
  }
  const rounded = Math.round(raw * 100) / 100;
  if (rounded <= 0) {
    throw badRequest("target_price must be greater than zero");
  }
  if (rounded > MAX_TARGET_PRICE) {
    throw badRequest("target_price is too large");
  }
  return rounded;
}

/** Creates or updates the caller's watch for a product in a market. */
export async function watchProductService(
  userId: string,
  productId: string,
  body: Record<string, unknown>,
): Promise<{ watch: WatchResponse; created: boolean }> {
  const marketId = requireUuid(body, "market_id");
  const targetPrice = parseTargetPrice(body);

  const product = await getProductById(productId);
  if (!product) {
    throw notFound("Product");
  }
  const market = await getMarketById(marketId);
  if (!market) {
    throw badRequest("market_id does not reference an existing market");
  }
  if (!(await productHasOfferInMarket(productId, marketId))) {
    throw badRequest("Product is not offered in this market");
  }

  const { watch, created } = await upsertWatch({
    userId,
    productId,
    marketId,
    currency: market.currency,
    targetPrice,
  });
  return { watch: toWatchResponse(watch), created };
}

/** Removes (deactivates) only the caller's own watch. */
export async function unwatchProductService(
  userId: string,
  productId: string,
  query: Record<string, unknown>,
): Promise<void> {
  const marketId = requireUuid(query, "market_id");
  const removed = await deactivateWatch(userId, productId, marketId);
  if (!removed) {
    throw notFound("Watch");
  }
}

export interface WatchlistItem {
  product: {
    product_id: string;
    name: string;
    slug: string;
    brand: string | null;
    image_url: string | null;
    status: string;
  };
  market_id: string | null;
  target_price: number | null;
  currency: string | null;
  active: boolean;
  watching_since: Date;
  offer_count: number;
  /** Best active offer by effective price (in stock first); null when none. */
  lowest_shown_price: {
    offer_id: string;
    merchant: { merchant_id: string; name: string; slug: string };
    listed_price: number;
    effective_price: number;
    currency: string;
    availability_status: string;
    /** true = sample/test offer, never live merchant pricing. */
    is_fixture: boolean;
  } | null;
  price_status: {
    status: string;
    verdict: string;
    difference_pct: number | null;
    observation_count: number;
  };
  /**
   * Whether the target is met by a usable (in-stock, non-sample) price.
   * Null when there is no target or no usable price.
   */
  target_reached: boolean | null;
}

/**
 * The caller's watchlist for one market. Three queries per page however
 * many products are watched: the watches, all their active offers, and
 * all their price observations. Pricing and price status come from the
 * existing effective-price and price-status modules.
 */
export async function getWatchlistService(
  userId: string,
  query: Record<string, unknown>,
  limit: number,
  offset: number,
): Promise<{ rows: WatchlistItem[]; total: number }> {
  const marketId = requireUuid(query, "market_id");
  const market = await getMarketById(marketId);
  if (!market) {
    throw notFound("Market");
  }
  const includeInactive = query.include_inactive === "true";

  const { rows, total } = await listWatchlist(
    userId,
    marketId,
    includeInactive,
    limit,
    offset,
  );
  const productIds = rows.map((row) => row.product_id);

  const config = DEFAULT_PRICE_INTELLIGENCE_CONFIG.priceStatus;
  const [offerRows, observationRows] = await Promise.all([
    listActiveOffersForProducts(marketId, productIds),
    listObservationsForProducts(
      marketId,
      productIds,
      config.windowDays,
      config.includeFixtureData,
    ),
  ]);

  const offersByProduct = new Map<string, ActiveOfferRow[]>();
  for (const offer of offerRows) {
    const list = offersByProduct.get(offer.product_id) ?? [];
    list.push(offer);
    offersByProduct.set(offer.product_id, list);
  }
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

  const items = rows.map((row): WatchlistItem => {
    const offers = offersByProduct.get(row.product_id) ?? [];
    const ranked = rankOffersByEffectivePrice(
      offers.map((offer) => ({
        offerId: offer.offer_id,
        listedPrice: Number(offer.price),
        inStock: offer.availability_status !== "out_of_stock",
      })),
    );
    const best = ranked[0];
    const bestOffer = best
      ? offers.find((offer) => offer.offer_id === best.offerId)
      : undefined;

    const status = computePriceStatus(
      best ? best.listedPrice : Number.NaN,
      bestOffer
        ? (observationsByKey.get(`${row.product_id}:${bestOffer.merchant_id}`) ?? [])
        : [],
      config,
    );

    const target = row.target_price === null ? null : Number(row.target_price);
    const usable = pickUsableOffer(
      offers.map((offer) => ({
        offer_id: offer.offer_id,
        price: Number(offer.price),
        availability_status: offer.availability_status,
        is_fixture: offer.is_fixture,
      })),
    );

    return {
      product: {
        product_id: row.product_id,
        name: row.product_name,
        slug: row.product_slug,
        brand: row.product_brand,
        image_url: row.product_image_url,
        status: row.product_status,
      },
      market_id: row.market_id,
      target_price: target,
      currency: row.currency,
      active: row.is_active,
      watching_since: row.created_at,
      offer_count: offers.length,
      lowest_shown_price:
        best && bestOffer
          ? {
              offer_id: bestOffer.offer_id,
              merchant: {
                merchant_id: bestOffer.merchant_id,
                name: bestOffer.merchant_name,
                slug: bestOffer.merchant_slug,
              },
              listed_price: best.listedPrice,
              effective_price: best.effectivePrice,
              currency: bestOffer.currency,
              availability_status: bestOffer.availability_status,
              is_fixture: bestOffer.is_fixture,
            }
          : null,
      price_status: {
        status: status.status,
        verdict: status.verdict,
        difference_pct: status.differencePct,
        observation_count: status.observationCount,
      },
      target_reached:
        target !== null && usable
          ? isTargetReached(usable.effectivePrice, target)
          : null,
    };
  });

  return { rows: items, total };
}
