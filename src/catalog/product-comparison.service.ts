import { checkAffiliateAvailability } from "../affiliate/affiliate-link.service.js";
import { notFound } from "../api/http/errors.js";
import { listDeals, type DealRow } from "../deal/deal.repository.js";
import { getMerchantById, type MerchantRow } from "../merchant/merchant.repository.js";
import { listOffers, type OfferRow } from "../offer/offer.repository.js";
import { getProductById, type ProductRow } from "./product.repository.js";

export interface ComparisonOfferEntry {
  offer: OfferRow;
  merchant: MerchantRow | null;
  deal: DealRow | null;
  affiliate_available: boolean;
}

export interface ComparisonLowestPrice {
  amount: number;
  currency: string;
  offer_id: string;
}

export interface ComparisonResult {
  product: ProductRow;
  offers: ComparisonOfferEntry[];
  comparison: {
    lowest_price: ComparisonLowestPrice | null;
    offer_count: number;
  };
}

/**
 * Compares active offers for one product within one market.
 *
 * Per the Stage 1D task: "identify the lowest available listed price
 * based on the available offer data... do not build a sophisticated
 * recommendation AI... do not invent shipping/tax calculations". This
 * is a straightforward numeric min() over each offer's `price`
 * column - nothing more.
 *
 * market_id is required (not optional) specifically so results are
 * never silently mixed across markets/currencies - see the "market
 * isolation" test in tests/api/comparison.test.ts. Known
 * simplification: offers within a market are assumed to share a
 * currency in practice (nothing in the schema enforces this at the
 * DB level); the comparison does not attempt cross-currency
 * conversion.
 */
export async function getProductComparisonService(
  productId: string,
  marketId: string,
): Promise<ComparisonResult> {
  const product = await getProductById(productId);
  if (!product) {
    throw notFound("Product");
  }

  const { rows: offers } = await listOffers(
    { productId, marketId, status: "active" },
    100,
    0,
  );

  const entries: ComparisonOfferEntry[] = [];
  for (const offer of offers) {
    const [merchant, dealsResult, availability] = await Promise.all([
      getMerchantById(offer.merchant_id),
      listDeals(
        { merchantId: offer.merchant_id, marketId, productId, status: "active" },
        1,
        0,
      ),
      checkAffiliateAvailability(offer.merchant_id),
    ]);

    entries.push({
      offer,
      merchant,
      deal: dealsResult.rows[0] ?? null,
      affiliate_available: availability.available,
    });
  }

  let lowestPrice: ComparisonLowestPrice | null = null;
  for (const entry of entries) {
    const price = Number(entry.offer.price);
    if (Number.isNaN(price)) {
      continue;
    }
    if (!lowestPrice || price < lowestPrice.amount) {
      lowestPrice = {
        amount: price,
        currency: entry.offer.currency,
        offer_id: entry.offer.offer_id,
      };
    }
  }

  return {
    product,
    offers: entries,
    comparison: {
      lowest_price: lowestPrice,
      offer_count: entries.length,
    },
  };
}
