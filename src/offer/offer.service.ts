import { translateDbError } from "../api/http/db-errors.js";
import { badRequest, notFound } from "../api/http/errors.js";
import { recordExists } from "../api/http/exists.js";
import {
  optionalBoolean,
  optionalEnum,
  optionalNumber,
  optionalString,
  optionalUrl,
  optionalUuid,
  requireNumber,
  requireString,
  requireUrl,
  requireUuid,
} from "../api/http/validation.js";
import { generatePriceAlertsSafely } from "../alert/price-alert.service.js";
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
  // offer_url is validated as a well-formed http(s) URL, not just a
  // non-empty string, since it feeds the Stage 1D affiliate redirect
  // endpoint's Location header - see validation.ts's requireUrl.
  const offerUrl = requireUrl(body, "offer_url");
  const price = requireNumber(body, "price");
  const originalPrice = optionalNumber(body, "original_price");
  const currency = requireString(body, "currency");
  const condition = optionalEnum(body, "condition", CONDITIONS);
  const availabilityStatus = optionalEnum(body, "availability_status", AVAILABILITY);
  const status = optionalEnum(body, "status", STATUSES);
  // Optional marker for sample/test offers (defaults to false = real).
  const isFixture = optionalBoolean(body, "is_fixture");

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

  let created: OfferRow;
  try {
    created = await createOffer({
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
      isFixture,
    });
  } catch (error) {
    throw translateDbError(
      error,
      "An offer for this product, merchant and market already exists",
      "Invalid product_id, merchant_id or market_id",
    );
  }

  // The price observation was recorded by the database trigger; now see
  // whether any user's target price has been reached.
  await generatePriceAlertsSafely(created.product_id, created.market_id);
  return created;
}

export async function updateOfferService(
  offerId: string,
  body: Record<string, unknown>,
): Promise<OfferRow> {
  await getOfferService(offerId);

  const offerUrl = optionalUrl(body, "offer_url");
  const price = optionalNumber(body, "price");
  const originalPrice = optionalNumber(body, "original_price");
  const currency = optionalString(body, "currency");
  const condition = optionalEnum(body, "condition", CONDITIONS);
  const availabilityStatus = optionalEnum(body, "availability_status", AVAILABILITY);
  const status = optionalEnum(body, "status", STATUSES);
  const isFixture = optionalBoolean(body, "is_fixture");

  if (price !== undefined && price < 0) {
    throw badRequest("price must be zero or greater");
  }
  if (originalPrice !== undefined && originalPrice < 0) {
    throw badRequest("original_price must be zero or greater");
  }

  let updated: OfferRow | null;
  try {
    updated = await updateOffer(offerId, {
      offerUrl,
      price,
      originalPrice,
      currency,
      condition,
      availabilityStatus,
      status,
      isFixture,
    });
  } catch (error) {
    throw translateDbError(
      error,
      "Update would violate a uniqueness constraint",
      "Invalid reference",
    );
  }
  if (!updated) {
    throw notFound("Offer");
  }

  // Only changes that can affect whether a target price is reached.
  if (
    price !== undefined ||
    currency !== undefined ||
    availabilityStatus !== undefined ||
    status !== undefined ||
    isFixture !== undefined
  ) {
    await generatePriceAlertsSafely(updated.product_id, updated.market_id);
  }
  return updated;
}

export async function deactivateOfferService(offerId: string): Promise<OfferRow> {
  await getOfferService(offerId);
  const updated = await deactivateOffer(offerId);
  if (!updated) {
    throw notFound("Offer");
  }
  return updated;
}
