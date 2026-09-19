import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";

/** A short random suffix so parallel/repeated test runs never collide on slug/code uniqueness. */
export function uniqueSlug(base: string): string {
  return `${base}-${randomUUID().slice(0, 8)}`;
}

interface ListResponseBody {
  success: boolean;
  data: Array<Record<string, unknown>>;
}

export async function getSeededMarketId(app: FastifyInstance): Promise<string> {
  const response = await app.inject({ method: "GET", url: "/api/v1/markets?limit=100" });
  const body = response.json() as ListResponseBody;
  const market = body.data.find((row) => row.code === "US");
  if (!market) {
    throw new Error("Seeded USA market not found - did Stage 1B seeds run?");
  }
  return market.market_id as string;
}

export async function getSeededCategoryId(app: FastifyInstance): Promise<string> {
  const response = await app.inject({ method: "GET", url: "/api/v1/categories?limit=100" });
  const body = response.json() as ListResponseBody;
  const category = body.data.find((row) => row.slug === "electronics");
  if (!category) {
    throw new Error("Seeded electronics category not found - did Stage 1B seeds run?");
  }
  return category.category_id as string;
}

export async function getSeededMerchantId(app: FastifyInstance): Promise<string> {
  const response = await app.inject({ method: "GET", url: "/api/v1/merchants?limit=100" });
  const body = response.json() as ListResponseBody;
  const merchant = body.data.find((row) => row.slug === "amazon");
  if (!merchant) {
    throw new Error("Seeded Amazon merchant not found - did Stage 1B seeds run?");
  }
  return merchant.merchant_id as string;
}
