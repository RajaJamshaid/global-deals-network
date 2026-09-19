import { translateDbError } from "../api/http/db-errors.js";
import { badRequest, notFound } from "../api/http/errors.js";
import { recordExists, type ExistsTable } from "../api/http/exists.js";
import {
  optionalBoolean,
  optionalDate,
  optionalEnum,
  optionalNumber,
  optionalString,
  optionalUuid,
  requireString,
  requireUuid,
} from "../api/http/validation.js";
import {
  archiveDeal,
  createDeal,
  getDealById,
  listDeals,
  updateDeal,
  type DealFilters,
  type DealRow,
} from "./deal.repository.js";

const DEAL_STATUSES = [
  "draft",
  "pending_review",
  "active",
  "paused",
  "expired",
  "rejected",
  "archived",
] as const;
const VERIFICATION_STATUSES = ["unverified", "verified", "flagged"] as const;

export async function listDealsService(
  query: Record<string, unknown>,
  limit: number,
  offset: number,
): Promise<{ rows: DealRow[]; total: number }> {
  const filters: DealFilters = {};
  const marketId = optionalUuid(query, "market_id");
  if (marketId) filters.marketId = marketId;
  const categoryId = optionalUuid(query, "category_id");
  if (categoryId) filters.categoryId = categoryId;
  const merchantId = optionalUuid(query, "merchant_id");
  if (merchantId) filters.merchantId = merchantId;
  const status = optionalEnum(query, "status", DEAL_STATUSES);
  if (status) filters.status = status;

  return listDeals(filters, limit, offset);
}

export async function getDealService(dealId: string): Promise<DealRow> {
  const deal = await getDealById(dealId);
  if (!deal) {
    throw notFound("Deal");
  }
  return deal;
}

async function validateReferences(refs: {
  merchantId?: string;
  marketId?: string;
  offerId?: string;
  productId?: string;
  categoryId?: string;
}): Promise<void> {
  const checks: Array<[string | undefined, ExistsTable, string]> = [
    [refs.merchantId, "merchants", "merchant_id"],
    [refs.marketId, "markets", "market_id"],
    [refs.offerId, "offers", "offer_id"],
    [refs.productId, "products", "product_id"],
    [refs.categoryId, "categories", "category_id"],
  ];

  for (const [id, table, field] of checks) {
    if (id && !(await recordExists(table, id))) {
      throw badRequest(`${field} does not reference an existing record`);
    }
  }
}

function validateDiscountPercentage(value: number | undefined): void {
  if (value !== undefined && (value < 0 || value > 100)) {
    throw badRequest("discount_percentage must be between 0 and 100");
  }
}

export async function createDealService(
  body: Record<string, unknown>,
): Promise<DealRow> {
  const merchantId = requireUuid(body, "merchant_id");
  const marketId = requireUuid(body, "market_id");
  const title = requireString(body, "title");
  const slug = requireString(body, "slug");
  const description = optionalString(body, "description");
  const offerId = optionalUuid(body, "offer_id");
  const productId = optionalUuid(body, "product_id");
  const categoryId = optionalUuid(body, "category_id");
  const dealType = optionalString(body, "deal_type");
  const originalPrice = optionalNumber(body, "original_price");
  const salePrice = optionalNumber(body, "sale_price");
  const discountPercentage = optionalNumber(body, "discount_percentage");
  const currency = requireString(body, "currency");
  const couponCode = optionalString(body, "coupon_code");
  const startsAt = optionalDate(body, "starts_at");
  const expiresAt = optionalDate(body, "expires_at");
  const dealStatus = optionalEnum(body, "deal_status", DEAL_STATUSES);
  const verificationStatus = optionalEnum(body, "verification_status", VERIFICATION_STATUSES);
  const featuredStatus = optionalBoolean(body, "featured_status");

  validateDiscountPercentage(discountPercentage);
  await validateReferences({ merchantId, marketId, offerId, productId, categoryId });

  try {
    return await createDeal({
      merchantId,
      marketId,
      title,
      slug,
      description,
      offerId,
      productId,
      categoryId,
      dealType,
      originalPrice,
      salePrice,
      discountPercentage,
      currency,
      couponCode,
      startsAt,
      expiresAt,
      dealStatus,
      verificationStatus,
      featuredStatus,
    });
  } catch (error) {
    throw translateDbError(
      error,
      "A deal with this slug already exists",
      "Invalid reference (merchant_id, market_id, offer_id, product_id or category_id)",
    );
  }
}

export async function updateDealService(
  dealId: string,
  body: Record<string, unknown>,
): Promise<DealRow> {
  await getDealService(dealId);

  const title = optionalString(body, "title");
  const description = optionalString(body, "description");
  const offerId = optionalUuid(body, "offer_id");
  const productId = optionalUuid(body, "product_id");
  const categoryId = optionalUuid(body, "category_id");
  const dealType = optionalString(body, "deal_type");
  const originalPrice = optionalNumber(body, "original_price");
  const salePrice = optionalNumber(body, "sale_price");
  const discountPercentage = optionalNumber(body, "discount_percentage");
  const currency = optionalString(body, "currency");
  const couponCode = optionalString(body, "coupon_code");
  const startsAt = optionalDate(body, "starts_at");
  const expiresAt = optionalDate(body, "expires_at");
  const dealStatus = optionalEnum(body, "deal_status", DEAL_STATUSES);
  const verificationStatus = optionalEnum(body, "verification_status", VERIFICATION_STATUSES);
  const featuredStatus = optionalBoolean(body, "featured_status");

  validateDiscountPercentage(discountPercentage);
  await validateReferences({ offerId, productId, categoryId });

  try {
    const updated = await updateDeal(dealId, {
      title,
      description,
      offerId,
      productId,
      categoryId,
      dealType,
      originalPrice,
      salePrice,
      discountPercentage,
      currency,
      couponCode,
      startsAt,
      expiresAt,
      dealStatus,
      verificationStatus,
      featuredStatus,
    });
    if (!updated) {
      throw notFound("Deal");
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

export async function archiveDealService(dealId: string): Promise<DealRow> {
  await getDealService(dealId);
  const updated = await archiveDeal(dealId);
  if (!updated) {
    throw notFound("Deal");
  }
  return updated;
}
