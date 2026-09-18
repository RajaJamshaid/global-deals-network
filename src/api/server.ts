import Fastify, { type FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { healthRoutes } from "./routes/health.js";

/**
 * Builds (but does not start) the GDN API server.
 *
 * All route modules are registered under /api/{version} so that future
 * modules (market, catalog, merchant, offer, deal, affiliate, search, ...)
 * can be added here as additional `app.register(...)` calls without
 * rewriting the server itself - see GDN_Implementation_Master_Roadmap.md
 * Phase 2 (Backend/API Foundation).
 */
export function buildServer(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  app.register(
    async (versioned) => {
      await versioned.register(healthRoutes);
      // Future Stage 1 routes (per GDN_Repository_And_Environment_Setup.md
      // section 18) will be registered here as they are implemented:
      // markets, categories, products, merchants, deals, search,
      // affiliate/redirect.
    },
    { prefix: `/api/${env.apiVersion}` },
  );

  return app;
}
