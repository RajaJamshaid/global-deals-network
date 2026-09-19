import { env } from "../../config/env.js";
import type { AffiliateProvider } from "./types.js";

/**
 * Amazon Associates adapter - the first AffiliateProvider
 * implementation. Appends Amazon's documented, publicly known
 * Associates "tag" query parameter to a product URL
 * (https://.../product?...&tag=yourtag-20); this is Amazon's
 * standard public link format, not a scraped or reverse-engineered
 * mechanism, and requires no API access.
 *
 * Real conversion/commission reporting requires Amazon's official
 * Product Advertising API / Associates reporting access, which this
 * project does not have yet - see
 * docs/implementation/GDN_Stage1D_Amazon_Affiliate_Commerce_Foundation.md
 * ("Conversion / Revenue") for what that later stage will need.
 */
export const amazonProvider: AffiliateProvider = {
  networkName: "amazon_associates",

  isConfigured(): boolean {
    return env.amazonAffiliateEnabled && Boolean(env.amazonAffiliateTag);
  },

  buildAffiliateUrl(destinationUrl: string): string {
    if (!this.isConfigured()) {
      throw new Error("Amazon affiliate program is not configured");
    }
    const url = new URL(destinationUrl);
    url.searchParams.set("tag", env.amazonAffiliateTag as string);
    return url.toString();
  },
};
