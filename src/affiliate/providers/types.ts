/**
 * Common interface every affiliate network/merchant adapter
 * implements. Amazon is the first implementation
 * (amazon.provider.ts); Walmart, eBay, etc. plug in later behind
 * this same shape without changing anything that calls it - per the
 * Stage 1D task's "Affiliate Engine: Amazon adapter, Walmart adapter
 * (future), eBay adapter (future)".
 */
export interface AffiliateProvider {
  /** Must match affiliate_programs.network_name for the merchants this provider serves. */
  readonly networkName: string;

  /** Whether this provider currently has the configuration (tag, API keys, ...) it needs to generate real links. */
  isConfigured(): boolean;

  /** Turns a merchant product URL into an affiliate-tracked URL. Throws if not configured - callers should check isConfigured() first. */
  buildAffiliateUrl(destinationUrl: string): string;
}
