import { badRequest, notFound } from "../api/http/errors.js";
import { getOfferById } from "../offer/offer.repository.js";
import {
  createAffiliateLink,
  findAffiliateLinkByDestination,
  getAffiliateLinkById,
  getAffiliateProgramByMerchant,
  type AffiliateLinkRow,
} from "./affiliate.repository.js";
import { getProvider } from "./providers/registry.js";

export interface AffiliateAvailability {
  available: boolean;
  reason?: string;
}

/**
 * Checks whether an affiliate link *could* be generated for a
 * merchant, without creating anything or throwing. Used to report
 * `affiliate_available` on a product/offer without a write - per the
 * Stage 1D task's "Affiliate availability must not determine whether
 * a product is visible. Affiliate monetization is an additional
 * layer": a product/offer is always shown regardless of this result.
 */
export async function checkAffiliateAvailability(
  merchantId: string,
): Promise<AffiliateAvailability> {
  const program = await getAffiliateProgramByMerchant(merchantId);
  if (!program) {
    return { available: false, reason: "No affiliate program configured for this merchant" };
  }
  if (program.status !== "active") {
    return { available: false, reason: `Affiliate program status is '${program.status}'` };
  }
  const provider = getProvider(program.network_name);
  if (!provider) {
    return {
      available: false,
      reason: `No provider implemented for network '${program.network_name}'`,
    };
  }
  if (!provider.isConfigured()) {
    return {
      available: false,
      reason: "Affiliate provider is not configured (missing credentials/tag)",
    };
  }
  return { available: true };
}

export interface GenerateAffiliateLinkResult {
  link: AffiliateLinkRow;
  created: boolean;
}

/**
 * Generates (or reuses) an affiliate link for an offer.
 *
 * Merchant/program-agnostic by design: this function never mentions
 * Amazon - the actual URL-building logic lives entirely behind the
 * AffiliateProvider looked up from the offer's merchant's
 * affiliate_programs.network_name, per the Stage 1D task's
 * "AffiliateLinkService.generate(product/offer, affiliateProgram)"
 * requirement. Adding Walmart/eBay/etc. later means adding a new
 * provider (see providers/registry.ts), not changing this function.
 */
export async function generateAffiliateLinkForOffer(
  offerId: string,
): Promise<GenerateAffiliateLinkResult> {
  const offer = await getOfferById(offerId);
  if (!offer) {
    throw notFound("Offer");
  }

  const program = await getAffiliateProgramByMerchant(offer.merchant_id);
  if (!program) {
    throw badRequest("No affiliate program configured for this merchant");
  }
  if (program.status !== "active") {
    throw badRequest(`Affiliate program status is '${program.status}', cannot generate links`);
  }

  const provider = getProvider(program.network_name);
  if (!provider) {
    throw badRequest(`No provider implemented for network '${program.network_name}'`);
  }
  if (!provider.isConfigured()) {
    throw badRequest("Affiliate provider is not configured");
  }

  const existing = await findAffiliateLinkByDestination(
    program.affiliate_program_id,
    offer.offer_url,
  );
  if (existing) {
    return { link: existing, created: false };
  }

  const affiliateUrl = provider.buildAffiliateUrl(offer.offer_url);

  const link = await createAffiliateLink({
    affiliateProgramId: program.affiliate_program_id,
    merchantId: offer.merchant_id,
    destinationUrl: offer.offer_url,
    affiliateUrl,
    productId: offer.product_id,
  });

  return { link, created: true };
}

export async function getAffiliateLinkService(
  affiliateLinkId: string,
): Promise<AffiliateLinkRow> {
  const link = await getAffiliateLinkById(affiliateLinkId);
  if (!link) {
    throw notFound("Affiliate link");
  }
  return link;
}
