import { rankOffersByEffectivePrice } from "../deal/intelligence/effective-price.js";
import { listOffers } from "../offer/offer.repository.js";
import {
  getLatestObservations,
  insertTargetReachedEvents,
  listActiveTargetWatches,
} from "./price-alert.repository.js";

/**
 * Price alerts (Phase 1, Commit 6): decides when a watch should raise a
 * 'target_price_reached' event and records it in price_alert_event.
 *
 * No pricing algorithm lives here: the current price is the effective
 * price from the existing effective-price module. Only the comparison
 * with the user's target is new, and it is one pure function.
 *
 * A watch is eligible when ALL hold:
 *   - the watch is active and has a target price
 *   - there is a usable current price: the best IN-STOCK, NON-FIXTURE
 *     active offer in the watch's market (sample data and unavailable
 *     offers never alert a real user)
 *   - that effective price is <= the target
 *
 * Duplicate protection: each event is tied to the exact price
 * observation (history_id) that triggered it. The database's unique
 * index (watch_id, history_id, event_type) makes running this any
 * number of times safe - the same observation never alerts the same
 * watch twice. An offer with no matching stored observation is skipped,
 * because the event could not be de-duplicated.
 *
 * Events are created 'pending'. Delivery (Telegram) is a later step, so
 * nothing here marks anything as sent.
 */

export interface PricedOffer {
  offer_id: string;
  /** Listed price as a number. */
  price: number;
  availability_status: string;
  is_fixture: boolean;
}

export interface UsableOffer {
  offerId: string;
  listedPrice: number;
  effectivePrice: number;
}

function cents(value: number): number {
  return Math.round(value * 100);
}

/** True when a usable current effective price is at or below a positive target. */
export function isTargetReached(
  effectivePrice: number | null | undefined,
  targetPrice: number | null | undefined,
): boolean {
  if (
    effectivePrice === null ||
    effectivePrice === undefined ||
    targetPrice === null ||
    targetPrice === undefined ||
    !Number.isFinite(effectivePrice) ||
    !Number.isFinite(targetPrice)
  ) {
    return false;
  }
  if (targetPrice <= 0 || effectivePrice < 0) {
    return false;
  }
  return cents(effectivePrice) <= cents(targetPrice);
}

/**
 * The best offer a user could actually act on: in stock (unknown counts
 * as available), not sample data, ranked by the existing effective-price
 * logic. Null when there is none.
 */
export function pickUsableOffer(offers: readonly PricedOffer[]): UsableOffer | null {
  const candidates = offers.filter(
    (offer) =>
      !offer.is_fixture &&
      offer.availability_status !== "out_of_stock" &&
      Number.isFinite(offer.price) &&
      offer.price >= 0,
  );
  if (candidates.length === 0) {
    return null;
  }
  const [best] = rankOffersByEffectivePrice(
    candidates.map((offer) => ({
      offerId: offer.offer_id,
      listedPrice: offer.price,
      inStock: true,
      // No verified coupon/cashback source exists yet.
      adjustments: [],
    })),
  );
  return best
    ? {
        offerId: best.offerId,
        listedPrice: best.listedPrice,
        effectivePrice: best.effectivePrice,
      }
    : null;
}

export interface AlertRunResult {
  evaluatedWatches: number;
  eligibleWatches: number;
  eventsCreated: number;
  /** Why nothing was created, when that is not simply "no eligible watch". */
  skippedReason: string | null;
}

const NOTHING: Omit<AlertRunResult, "skippedReason"> = {
  evaluatedWatches: 0,
  eligibleWatches: 0,
  eventsCreated: 0,
};

/** Evaluates every active target watch of a product in a market. Safe to run repeatedly. */
export async function generatePriceAlertsForProduct(
  productId: string,
  marketId: string,
): Promise<AlertRunResult> {
  const watches = await listActiveTargetWatches(productId, marketId);
  if (watches.length === 0) {
    return { ...NOTHING, skippedReason: null };
  }

  const { rows: offerRows } = await listOffers(
    { productId, marketId, status: "active" },
    100,
    0,
  );
  const usable = pickUsableOffer(
    offerRows.map((offer) => ({
      offer_id: offer.offer_id,
      price: Number(offer.price),
      availability_status: offer.availability_status,
      is_fixture: offer.is_fixture,
    })),
  );
  if (!usable) {
    return { ...NOTHING, evaluatedWatches: watches.length, skippedReason: "no_usable_price" };
  }

  const eligible = watches.filter((watch) =>
    isTargetReached(usable.effectivePrice, Number(watch.target_price)),
  );
  if (eligible.length === 0) {
    return { ...NOTHING, evaluatedWatches: watches.length, skippedReason: null };
  }

  const offer = offerRows.find((row) => row.offer_id === usable.offerId);
  const [latest, previous] = await getLatestObservations(usable.offerId, 2);
  if (
    !offer ||
    !latest ||
    Number(latest.price) !== usable.listedPrice ||
    latest.currency !== offer.currency
  ) {
    // Without the matching observation the event could not be de-duplicated.
    return {
      evaluatedWatches: watches.length,
      eligibleWatches: eligible.length,
      eventsCreated: 0,
      skippedReason: "no_matching_observation",
    };
  }

  const eventsCreated = await insertTargetReachedEvents({
    watchIds: eligible.map((watch) => watch.watch_id),
    merchantId: offer.merchant_id,
    offerId: offer.offer_id,
    historyId: latest.history_id,
    triggerPrice: usable.effectivePrice,
    previousPrice: previous ? Number(previous.price) : null,
    currency: offer.currency,
  });

  return {
    evaluatedWatches: watches.length,
    eligibleWatches: eligible.length,
    eventsCreated,
    skippedReason: null,
  };
}

/**
 * Called after an offer changes. Alert bookkeeping must never make an
 * offer write fail, so errors are logged (message only) and swallowed.
 */
export async function generatePriceAlertsSafely(
  productId: string,
  marketId: string,
): Promise<void> {
  try {
    await generatePriceAlertsForProduct(productId, marketId);
  } catch (error) {
    console.error(
      "Price alert generation failed:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}
