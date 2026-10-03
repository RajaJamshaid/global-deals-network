import { randomUUID } from "node:crypto";
import type {
  FastifyInstance,
  InjectOptions,
  LightMyRequestResponse,
} from "fastify";
import { buildServer, type BuildServerOptions } from "../../src/api/server.js";

/** A short random suffix so parallel/repeated test runs never collide on slug/code uniqueness. */
export function uniqueSlug(base: string): string {
  return `${base}-${randomUUID().slice(0, 8)}`;
}

/**
 * Authorization header carrying the FIXTURE internal API key (set by
 * tests/setup-env.ts or by CI) - needed by every write request.
 */
export function internalAuthHeaders(): Record<string, string> {
  const key = process.env.GDN_INTERNAL_API_KEY;
  if (!key) {
    throw new Error("GDN_INTERNAL_API_KEY is not set for tests (see tests/setup-env.ts)");
  }
  return { authorization: `Bearer ${key}` };
}

/**
 * buildServer() whose inject() sends the fixture internal API key on
 * every request, so existing write tests can create/update data.
 * Use plain buildServer() (see internal-auth.test.ts) to test the
 * guard itself. A test may still pass its own authorization header
 * (for example a Telegram `tma` credential), which takes precedence.
 */
export function buildAuthedServer(options: BuildServerOptions = {}): FastifyInstance {
  const app = buildServer(options);
  const originalInject = app.inject.bind(app) as unknown as (
    options: InjectOptions,
  ) => Promise<LightMyRequestResponse>;
  (app as unknown as { inject: typeof originalInject }).inject = (injectOptions) =>
    originalInject({
      ...injectOptions,
      headers: { ...internalAuthHeaders(), ...injectOptions.headers },
    });
  return app;
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
