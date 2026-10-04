import Fastify, { type FastifyInstance } from "fastify";
import { ApiError } from "./http/errors.js";
import { corsPlugin } from "./http/cors.js";
import { createInternalWriteGuard } from "./http/internal-auth.js";
import { rateLimitPlugin } from "./http/rate-limit.js";
import { healthRoutes } from "./routes/health.js";
import { env } from "../config/env.js";
import { affiliateRoutes } from "../affiliate/affiliate.routes.js";
import { redirectRoutes } from "../affiliate/redirect.routes.js";
import { categoryRoutes } from "../catalog/category.routes.js";
import { productRoutes } from "../catalog/product.routes.js";
import { dealRoutes } from "../deal/deal.routes.js";
import {
  IMAGE_SEARCH_ROUTE_PATTERN,
  barcodeRoutes,
  createImageSearchRoutes,
} from "../discovery/discovery.routes.js";
import {
  getConfiguredImageProvider,
  type ImageIdentificationProvider,
} from "../discovery/image-identification.js";
import { marketRoutes } from "../market/market.routes.js";
import { merchantRoutes } from "../merchant/merchant.routes.js";
import { offerRoutes } from "../offer/offer.routes.js";
import { seoRoutes } from "../seo/seo.routes.js";
import { telegramRoutes } from "../telegram/telegram.routes.js";
import { createTelegramAuthHook } from "../user/telegram-auth.js";
import { WATCH_ROUTE_PATTERN, watchRoutes } from "../user/watch.routes.js";

export interface BuildServerOptions {
  /**
   * Overrides GDN_INTERNAL_API_KEY (used by tests). Passing the
   * property with an undefined value simulates "not configured".
   */
  internalApiKey?: string | undefined;
  /**
   * Overrides TELEGRAM_BOT_TOKEN for Mini App initData verification
   * (used by tests, which never use a real bot token). Passing the
   * property with an undefined value simulates "not configured".
   */
  telegramBotToken?: string | undefined;
  /** Overrides TELEGRAM_INIT_DATA_MAX_AGE_SECONDS (used by tests). */
  telegramInitDataMaxAgeSeconds?: number;
  /**
   * Image-recognition provider for image search (used by tests to plug in
   * a stand-in). Defaults to the configured provider, which is none today:
   * the endpoint then answers "image identification unavailable".
   */
  imageIdentificationProvider?: ImageIdentificationProvider | null;
}

/** Message and code for client errors Fastify itself raises (bad JSON, oversize body, ...). */
function clientErrorBody(statusCode: number): { code: string; message: string } {
  if (statusCode === 413) {
    return { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" };
  }
  if (statusCode === 415) {
    return { code: "UNSUPPORTED_MEDIA_TYPE", message: "Unsupported media type" };
  }
  return { code: "VALIDATION_ERROR", message: "Invalid request" };
}

/**
 * Builds (but does not start) the GDN API server.
 *
 * API route modules are registered under /api/{version}. The public,
 * crawlable pages (product/category/store landing pages, sitemaps,
 * robots.txt) are registered at the root so their URLs are the canonical
 * site URLs.
 *
 * The centralized error handler is what turns a thrown ApiError (see
 * api/http/errors.ts) into the structured { success, error } response
 * defined by docs/architecture/GDN_API_Architecture.md - individual
 * routes never format error responses themselves. Anything that
 * isn't an ApiError (including raw PostgreSQL errors that slipped
 * past a service's translateDbError call) is logged server-side only
 * and returned to the client as a generic 500 - full details are
 * never leaked in the response body.
 *
 * Security: a root-level internal write guard (see
 * api/http/internal-auth.ts) rejects every non-GET/HEAD/OPTIONS
 * request that lacks the internal API key. The exemptions are the
 * Telegram webhook (its own webhook-secret authentication) and the
 * user-scoped routes (watch, image search), which authenticate with a
 * verified Telegram user and enforce requireUser in their plugins.
 *
 * User authentication (Mini App initData, `Authorization: tma ...`) is
 * separate from the internal key: a root hook attaches request.user
 * when a valid credential is present, and user-scoped routes opt in
 * with requireUser.
 */
export function buildServer(options: BuildServerOptions = {}): FastifyInstance {
  const internalApiKey =
    "internalApiKey" in options ? options.internalApiKey : env.internalApiKey;
  const telegramBotToken =
    "telegramBotToken" in options ? options.telegramBotToken : env.telegramBotToken;
  const telegramInitDataMaxAgeSeconds =
    options.telegramInitDataMaxAgeSeconds ?? env.telegramInitDataMaxAgeSeconds;
  const imageProvider =
    "imageIdentificationProvider" in options
      ? (options.imageIdentificationProvider ?? null)
      : getConfiguredImageProvider();

  const app = Fastify({
    // Credentials must never reach the logs, even if a serializer is
    // later changed to include request headers.
    logger: {
      redact: [
        "req.headers.authorization",
        'req.headers["x-telegram-bot-api-secret-token"]',
      ],
    },
    // Production traffic reaches this process through Cloudflare
    // (deals.tickmarktools.com), so the raw socket address is always
    // Cloudflare's edge, not the visitor. trustProxy makes
    // request.ip resolve from the forwarded-for chain instead, which
    // rate-limit.ts depends on to key per real client rather than
    // lumping every visitor into one shared bucket.
    trustProxy: true,
  });

  // Registered on the root instance, before any route, so it covers
  // every route (and unknown paths) in every plugin.
  app.addHook(
    "onRequest",
    createInternalWriteGuard({
      apiKey: internalApiKey,
      exemptRoutes: [
        `/api/${env.apiVersion}/telegram/webhook`,
        `/api/${env.apiVersion}${WATCH_ROUTE_PATTERN}`,
        `/api/${env.apiVersion}${IMAGE_SEARCH_ROUTE_PATTERN}`,
      ],
    }),
  );

  // Verified Telegram Mini App user (or null). Runs after the internal
  // guard; only acts on an `Authorization: tma <initData>` credential.
  app.decorateRequest("user", null);
  app.addHook(
    "onRequest",
    createTelegramAuthHook({
      botToken: telegramBotToken,
      maxAgeSeconds: telegramInitDataMaxAgeSeconds,
    }),
  );

  app.register(corsPlugin);
  app.register(rateLimitPlugin);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }

    // Client errors raised by Fastify itself (malformed JSON, a body over
    // the size limit, an unsupported media type): report them as the
    // client errors they are, in the standard format, without echoing any
    // of the request.
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 500) {
      return reply.status(statusCode).send({
        success: false,
        error: clientErrorBody(statusCode),
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });

  app.register(
    async (versioned) => {
      await versioned.register(healthRoutes);
      await versioned.register(marketRoutes);
      await versioned.register(categoryRoutes);
      await versioned.register(productRoutes);
      await versioned.register(barcodeRoutes);
      await versioned.register(createImageSearchRoutes(imageProvider));
      await versioned.register(merchantRoutes);
      await versioned.register(offerRoutes);
      await versioned.register(dealRoutes);
      await versioned.register(affiliateRoutes);
      await versioned.register(redirectRoutes);
      await versioned.register(telegramRoutes);
      await versioned.register(watchRoutes);
    },
    { prefix: `/api/${env.apiVersion}` },
  );

  // Public crawlable pages, sitemaps and robots.txt (canonical site URLs).
  app.register(seoRoutes);

  return app;
}
