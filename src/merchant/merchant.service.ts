import { translateDbError } from "../api/http/db-errors.js";
import { notFound } from "../api/http/errors.js";
import { optionalEnum, optionalString, requireString } from "../api/http/validation.js";
import {
  createMerchant,
  deactivateMerchant,
  getMerchantById,
  listMerchants,
  updateMerchant,
  type MerchantFilters,
  type MerchantRow,
} from "./merchant.repository.js";

/**
 * Generic merchant CRUD - no Amazon-specific logic here, per the
 * Stage 1C task ("The API must not assume Amazon is the only
 * merchant... Do not hard-code Amazon-specific logic into generic
 * merchant CRUD"). Amazon is just the first seeded row.
 */
const AFFILIATE_STATUSES = ["pending", "active", "suspended", "inactive"] as const;
const MERCHANT_STATUSES = ["pending", "active", "suspended", "inactive"] as const;

export async function listMerchantsService(
  query: Record<string, unknown>,
  limit: number,
  offset: number,
): Promise<{ rows: MerchantRow[]; total: number }> {
  const filters: MerchantFilters = {};
  const status = optionalEnum(query, "status", MERCHANT_STATUSES);
  if (status) filters.status = status;
  return listMerchants(filters, limit, offset);
}

export async function getMerchantService(
  merchantId: string,
): Promise<MerchantRow> {
  const merchant = await getMerchantById(merchantId);
  if (!merchant) {
    throw notFound("Merchant");
  }
  return merchant;
}

export async function createMerchantService(
  body: Record<string, unknown>,
): Promise<MerchantRow> {
  const name = requireString(body, "name");
  const slug = requireString(body, "slug");
  const websiteUrl = optionalString(body, "website_url");
  const logoUrl = optionalString(body, "logo_url");
  const description = optionalString(body, "description");
  const merchantType = optionalString(body, "merchant_type");
  const affiliateStatus = optionalEnum(body, "affiliate_status", AFFILIATE_STATUSES);
  const merchantStatus = optionalEnum(body, "merchant_status", MERCHANT_STATUSES);

  try {
    return await createMerchant({
      name,
      slug,
      websiteUrl,
      logoUrl,
      description,
      merchantType,
      affiliateStatus,
      merchantStatus,
    });
  } catch (error) {
    throw translateDbError(
      error,
      "A merchant with this slug already exists",
      "Invalid reference",
    );
  }
}

export async function updateMerchantService(
  merchantId: string,
  body: Record<string, unknown>,
): Promise<MerchantRow> {
  await getMerchantService(merchantId);

  const name = optionalString(body, "name");
  const websiteUrl = optionalString(body, "website_url");
  const logoUrl = optionalString(body, "logo_url");
  const description = optionalString(body, "description");
  const merchantType = optionalString(body, "merchant_type");
  const affiliateStatus = optionalEnum(body, "affiliate_status", AFFILIATE_STATUSES);
  const merchantStatus = optionalEnum(body, "merchant_status", MERCHANT_STATUSES);

  try {
    const updated = await updateMerchant(merchantId, {
      name,
      websiteUrl,
      logoUrl,
      description,
      merchantType,
      affiliateStatus,
      merchantStatus,
    });
    if (!updated) {
      throw notFound("Merchant");
    }
    return updated;
  } catch (error) {
    throw translateDbError(
      error,
      "A merchant with this slug already exists",
      "Invalid reference",
    );
  }
}

export async function deactivateMerchantService(
  merchantId: string,
): Promise<MerchantRow> {
  await getMerchantService(merchantId);
  const updated = await deactivateMerchant(merchantId);
  if (!updated) {
    throw notFound("Merchant");
  }
  return updated;
}
