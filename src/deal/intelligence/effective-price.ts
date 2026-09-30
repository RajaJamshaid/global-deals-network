/**
 * Effective price = listed price - applicable, VERIFIED adjustments.
 *
 * Phase 1 has no coupon/cashback provider, so callers normally pass
 * no adjustments and effective price equals the listed price. The
 * structure is ready for future providers: each adjustment declares
 * whether it is verified and where it came from, and unverified ones
 * are never applied. Merchant-agnostic - nothing here knows about
 * Amazon or any other merchant.
 */

export type AdjustmentType = "coupon" | "cashback" | "discount";

export interface PriceAdjustment {
  type: AdjustmentType;
  /** Fixed amount off, in the offer's currency. */
  amount?: number;
  /** Percentage off the listed price (0-100). Used when amount is absent. */
  percent?: number;
  /** Only verified adjustments are applied. */
  verified: boolean;
  source: string;
}

export interface EffectivePriceResult {
  listedPrice: number;
  effectivePrice: number;
  totalDiscount: number;
  appliedAdjustments: PriceAdjustment[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function adjustmentValue(listedPrice: number, adj: PriceAdjustment): number {
  if (adj.amount !== undefined && Number.isFinite(adj.amount) && adj.amount > 0) {
    return adj.amount;
  }
  if (
    adj.percent !== undefined &&
    Number.isFinite(adj.percent) &&
    adj.percent > 0 &&
    adj.percent <= 100
  ) {
    return (listedPrice * adj.percent) / 100;
  }
  return 0;
}

export function computeEffectivePrice(
  listedPrice: number,
  adjustments: readonly PriceAdjustment[] = [],
): EffectivePriceResult {
  if (!Number.isFinite(listedPrice) || listedPrice < 0) {
    throw new RangeError("listedPrice must be a non-negative number");
  }

  const applied: PriceAdjustment[] = [];
  let total = 0;
  for (const adj of adjustments) {
    if (!adj.verified) continue;
    const value = adjustmentValue(listedPrice, adj);
    if (value > 0) {
      applied.push(adj);
      total += value;
    }
  }
  total = Math.min(total, listedPrice);

  return {
    listedPrice,
    effectivePrice: round2(listedPrice - total),
    totalDiscount: round2(total),
    appliedAdjustments: applied,
  };
}

export interface RankableOffer {
  offerId: string;
  listedPrice: number;
  /** Callers treat unknown availability as available. */
  inStock: boolean;
  adjustments?: readonly PriceAdjustment[];
}

export interface RankedOffer extends EffectivePriceResult {
  offerId: string;
  inStock: boolean;
  rank: number;
}

/**
 * Ranks offers: in-stock first, then lowest effective price, then
 * lowest listed price, then offerId (stable tie-break). Rank 1 is the
 * best offer. Offers are assumed to share a currency (same market).
 */
export function rankOffersByEffectivePrice(
  offers: readonly RankableOffer[],
): RankedOffer[] {
  const computed = offers.map((offer) => ({
    offerId: offer.offerId,
    inStock: offer.inStock,
    ...computeEffectivePrice(offer.listedPrice, offer.adjustments ?? []),
  }));

  computed.sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    if (a.effectivePrice !== b.effectivePrice) {
      return a.effectivePrice - b.effectivePrice;
    }
    if (a.listedPrice !== b.listedPrice) return a.listedPrice - b.listedPrice;
    return a.offerId.localeCompare(b.offerId);
  });

  return computed.map((entry, index) => ({ ...entry, rank: index + 1 }));
}
