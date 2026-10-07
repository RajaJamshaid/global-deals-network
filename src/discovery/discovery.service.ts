import {
  imageIdentificationUnavailable,
  notFoundWithMessage,
} from "../api/http/errors.js";
import {
  getProductIntelligenceService,
  type ProductIntelligenceResult,
} from "../catalog/product-intelligence.service.js";
import { getProductById } from "../catalog/product.repository.js";
import { parseBarcode } from "./barcode.js";
import { findActiveProductIdByGtin } from "./barcode.repository.js";
import type {
  ImageIdentificationProvider,
  ImageUpload,
} from "./image-identification.js";

/**
 * Unified product discovery.
 *
 *   text search -----------+
 *   barcode lookup --------+--> canonical product_id --> market -->
 *   image identification --+    product intelligence (offers, effective
 *                               price, price status, Deal Score, redirect)
 *
 * Text search lists candidate products (see product-search.service.ts).
 * Barcode and image discovery each resolve ONE canonical product id, then
 * hand it to compareCanonicalProduct() - the single comparison pipeline,
 * which is exactly what GET /products/:id?market_id= uses. There is no
 * separate pricing, ranking or scoring for any discovery method.
 */
export type DiscoveryMethod = "barcode" | "image";

export interface DiscoveryOutcome {
  discovery: {
    method: DiscoveryMethod;
    canonical_product_id: string;
    /** Normalised 14-digit GTIN (barcode discovery only). */
    barcode?: string;
  };
  comparison: ProductIntelligenceResult;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The one comparison pipeline: canonical product + market -> full product intelligence. */
export async function compareCanonicalProduct(
  productId: string,
  marketId: string,
): Promise<ProductIntelligenceResult> {
  return getProductIntelligenceService(productId, marketId);
}

export async function discoverByBarcode(
  rawCode: unknown,
  marketId: string,
): Promise<DiscoveryOutcome> {
  const gtin = parseBarcode(rawCode);
  const productId = await findActiveProductIdByGtin(gtin);
  if (!productId) {
    throw notFoundWithMessage("Product not found for this barcode");
  }
  return {
    discovery: { method: "barcode", canonical_product_id: productId, barcode: gtin },
    comparison: await compareCanonicalProduct(productId, marketId),
  };
}

export async function discoverByImage(
  image: ImageUpload,
  marketId: string,
  provider: ImageIdentificationProvider | null,
): Promise<DiscoveryOutcome> {
  if (!provider) {
    // No recognition provider exists: say so, never guess a product.
    throw imageIdentificationUnavailable();
  }

  let identified;
  try {
    identified = await provider.identify(image);
  } catch {
    // Provider failures are reported as unavailable; details are not leaked.
    throw imageIdentificationUnavailable();
  }

  const notIdentified = (): Error =>
    notFoundWithMessage("No matching product was identified for this image");
  if (!identified || !UUID_PATTERN.test(identified.productId)) {
    throw notIdentified();
  }
  // Providers are not trusted: the id must be a real, active GDN product.
  const product = await getProductById(identified.productId);
  if (!product || product.status !== "active") {
    throw notIdentified();
  }

  return {
    discovery: { method: "image", canonical_product_id: product.product_id },
    comparison: await compareCanonicalProduct(product.product_id, marketId),
  };
}
