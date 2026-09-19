import { badRequest, notFound } from "../api/http/errors.js";
import { getDealById } from "../deal/deal.repository.js";
import { getOfferById } from "../offer/offer.repository.js";
import {
  checkAffiliateAvailability,
  generateAffiliateLinkForOffer,
} from "./affiliate-link.service.js";
import { isClickChannel, recordClickEvent } from "./click.repository.js";

export interface RedirectContext {
  channel?: string;
  sessionId?: string;
  campaignId?: string;
  placement?: string;
  deviceType?: string;
  referrer?: string;
}

export interface RedirectResult {
  redirectUrl: string;
  affiliateUsed: boolean;
}

/**
 * Resolves where a "View Deal" click should send the user, per
 * GDN_API_Architecture.md's `GET /api/v1/redirect/deal/{deal_id}`.
 *
 * SECURITY: the only user-controlled input is dealId - a UUID used
 * purely to look up our own database row. redirectUrl always comes
 * from data we already stored (offer.offer_url, or an affiliate_url
 * this same service generated from it) - never from a query
 * parameter or request body. This function cannot be turned into an
 * open redirect because there is no code path where an
 * attacker-supplied URL reaches the return value.
 *
 * Affiliate generation is best-effort: per the Stage 1D task
 * ("Affiliate availability must not determine whether a product is
 * visible" and "Do not block the user unnecessarily if tracking
 * fails"), any failure here - unconfigured provider, DB error - falls
 * back to the plain merchant URL rather than failing the redirect.
 */
export async function resolveDealRedirect(
  dealId: string,
  context: RedirectContext,
): Promise<RedirectResult> {
  const deal = await getDealById(dealId);
  if (!deal) {
    throw notFound("Deal");
  }
  if (!deal.offer_id) {
    throw badRequest("This deal has no associated offer to redirect to");
  }

  const offer = await getOfferById(deal.offer_id);
  if (!offer) {
    throw notFound("Offer");
  }

  let redirectUrl = offer.offer_url;
  let affiliateUsed = false;
  let affiliateLinkId: string | null = null;

  const availability = await checkAffiliateAvailability(offer.merchant_id);
  if (availability.available) {
    try {
      const { link } = await generateAffiliateLinkForOffer(offer.offer_id);
      if (link.affiliate_url) {
        redirectUrl = link.affiliate_url;
        affiliateUsed = true;
        affiliateLinkId = link.affiliate_link_id;
      }
    } catch {
      // Fall back to the plain merchant URL already set above.
    }
  }

  const channel = isClickChannel(context.channel) ? context.channel : "web";

  try {
    await recordClickEvent({
      affiliateLinkId,
      dealId: deal.deal_id,
      productId: offer.product_id,
      merchantId: offer.merchant_id,
      marketId: offer.market_id,
      sessionId: context.sessionId,
      channel,
      campaignId: context.campaignId,
      placement: context.placement,
      deviceType: context.deviceType,
      referrer: context.referrer,
    });
  } catch {
    // Tracking must never block the redirect (Stage 1D task, "Do not
    // block the user unnecessarily if tracking fails").
  }

  return { redirectUrl, affiliateUsed };
}
