import { amazonProvider } from "./amazon.provider.js";
import type { AffiliateProvider } from "./types.js";

/**
 * Adds a new merchant network to the affiliate engine without
 * touching affiliate-link.service.ts, redirect.service.ts, or any
 * route - only this file and a new providers/<network>.provider.ts
 * change, per the Stage 1D task's "future providers should be able
 * to plug into the same interface" requirement.
 */
const PROVIDERS: Record<string, AffiliateProvider> = {
  [amazonProvider.networkName]: amazonProvider,
};

export function getProvider(networkName: string): AffiliateProvider | null {
  return PROVIDERS[networkName] ?? null;
}
