import { translateDbError } from "../api/http/db-errors.js";
import { badRequest, notFound } from "../api/http/errors.js";
import { recordExists } from "../api/http/exists.js";
import {
  optionalEnum,
  optionalNumber,
  optionalString,
  optionalUuid,
  requireNumber,
  requireString,
  requireUuid,
} from "../api/http/validation.js";
import {
  createOffer,
  deactivateOffer,
  getOfferById,
  listOffers,
  updateOffer,
  type OfferFilters,
  type OfferRow,
} from "./offer.repository.js";

const CONDITIONS = ["new", "used", "refurbished", "open_box", "unknown"] as const;
const AVAILABILITY = ["in_stock", "out_of_stock", "unknown"] as const;
const STATUSES = ["active", "paused", "expired", "removed"] as const;

export async function listOffersService(
  query: Record<string, unknown>,
  limit: number,
  offset: number,
): Promise<{ rows: OfferRow[]; total: number }> {
  const filters: OfferFilters = {};
  const productId = optionalUuid(query, "product_id");
  if (productId) filters.productId = productId;
  const merchantId = optionalUuid(query, "merchant_id");
  if (merchantId) filters.merchantId = merchantId;
  const marketId = optionalUuid(query, "market_id");
  if (marketId) filters.marketId = marketId;
  const status = optionalEnum(query, "status", STATUSES);
  if (status) filters.status = status;

  return listOffers(filters, limit, offset);
}

export async function getOfferService(offerId: string): Promise<OfferRow> {
  const offer = await getOfferById(offerId);
  if (!offer) {
    throw notFound("Offer");
  }
  return offer;
}

export async function createOfferService(
  body: Record<string, unknown>,
): Promise<OfferRow> {
  const productId = requireUuid(body, "product_id");
  const merchantId = requireUuid(body, "merchant_id");
  const marketId = requireUuid(body, "market_id");
  const offerUrl = requireString(body, "offer_url");
  const price = requireNumber(body, "price");
  const originalPrice = optionalNumber(body, "original_price");
  const currency = requireString(body, "currency");
  const condition = optionalEnum(body, "condition", CONDITIONS);
  const availabilityStatus = optionalEnum(body, "availability_status", AVAILABILITY);
  const status = optionalEnum(body, "status", STATUSES);

  if (price < 0) {
    throw badRequest("price must be zero or greater");
  }
  if (originalPrice !== undefined && originalPrice < 0) {
    throw badRequest("original_price must be zero or greater");
  }

  const [productOk, merchantOk, marketOk] = await Promise.all([
    recordExists("products", productId),
    recordExists("merchants", merchantId),
    recordExists("markets", marketId),
  ]);
  if (!productOk) throw badRequest("product_id does not reference an existing product");
  if (!merchantOk) throw badRequest("merchant_id does not reference an existing merchant");
  if (!marketOk) throw badRequest("market_id does not reference an existing market");

  try {
    return await createOffer({
      productId,
      merchantId,
      marketId,
      offerUrl,
      price,
      originalPrice,
      currency,
      condition,
      availabilityStatus,
      status,
    });
  } catch (error) {
    throw translateDbError(
      error,
      "An offer for this product, merchant and market already exists",
      "Invalid product_id, merchant_id or market_id",
    );
  }
}

export async function updateOfferService(
  offerId: string,
  body: Record<string, unknown>,
): Promise<OfferRow> {
  await getOfferService(offerId);

  const offerUrl = optionalString(body, "offer_url");
  const price = optionalNumber(body, "price");
  const originalPrice = optionalNumber(body, "original_price");
  const currency = optionalString(body, "currency");
  const condition = optionalEnum(body, "condition", CONDITIONS);
  const availabilityStatus = optionalEnum(body, "availability_status", AVAILABILITY);
  const status = optionalEnum(body, "status", STATUSES);

  if (price !== undefined && price < 0) {
    throw badRequest("price must be zero or greater");
  }
  if (originalPrice !== undefined && originalPrice < 0) {
    throw badRequest("original_price must be zero or greater");
  }

  try {
    const updated = await updateOffer(offerId, {
      offerUrl,
      price,
      originalPrice,
      currency,
      condition,
      availabilityStatus,
      status,
    });
    if (!updated) {
      throw notFound("Offer");
    }
    return updated;
  } catch (error) {
    throw translateDbError(
      error,
      "Update would violate a uniqueness constraint",
      "Invalid reference",
    );
  }
}

export async function deactivateOfferService(offerId: string): Promise<OfferRow> {
  await getOfferService(offerId);
  const updated = await deactivateOffer(offerId);
  if (!updated) {
    throw notFound("Offer");
  }
  return updated;
}
