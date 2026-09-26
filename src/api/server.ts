import Fastify, { type FastifyInstance } from "fastify";
import { ApiError } from "./http/errors.js";
import { corsPlugin } from "./http/cors.js";
import { rateLimitPlugin } from "./http/rate-limit.js";
import { healthRoutes } from "./routes/health.js";
import { env } from "../config/env.js";
import { affiliateRoutes } from "../affiliate/affiliate.routes.js";
import { redirectRoutes } from "../affiliate/redirect.routes.js";
import { categoryRoutes } from "../catalog/category.routes.js";
import { productRoutes } from "../catalog/product.routes.js";
import { dealRoutes } from "../deal/deal.routes.js";
import { marketRoutes } from "../market/market.routes.js";
import { merchantRoutes } from "../merchant/merchant.routes.js";
import { offerRoutes } from "../offer/offer.routes.js";
import { telegramRoutes } from "../telegram/telegram.routes.js";

/**
 * Builds (but does not start) the GDN API server.
 *
 * All route modules are registered under /api/{version} so that future
 * modules (search, analytics, ...) can be added here as additional
 * `app.register(...)` calls without rewriting the server itself - see
 * GDN_Implementation_Master_Roadmap.md Phase 2 (Backend/API
 * Foundation).
 *
 * The centralized error handler is what turns a thrown ApiError (see
 * api/http/errors.ts) into the structured { success, error } response
 * defined by docs/architecture/GDN_API_Architecture.md - individual
 * routes never format error responses themselves. Anything that
 * isn't an ApiError (including raw PostgreSQL errors that slipped
 * past a service's translateDbError call) is logged server-side only
 * and returned to the client as a generic 500 - full details are
 * never leaked in the response body.
 */
export function buildServer(): FastifyInstance {
  const app = Fastify({
    logger: true,
    // Production traffic reaches this process through Cloudflare
    // (deals.tickmarktools.com), so the raw socket address is always
    // Cloudflare's edge, not the visitor. trustProxy makes
    // request.ip resolve from the forwarded-for chain instead, which
    // rate-limit.ts depends on to key per real client rather than
    // lumping every visitor into one shared bucket.
    trustProxy: true,
  });

  app.register(corsPlugin);
  app.register(rateLimitPlugin);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
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
      await versioned.register(merchantRoutes);
      await versioned.register(offerRoutes);
      await versioned.register(dealRoutes);
      await versioned.register(affiliateRoutes);
      await versioned.register(redirectRoutes);
      await versioned.register(telegramRoutes);
    },
    { prefix: `/api/${env.apiVersion}` },
  );

  return app;
}
