import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { getPool } from "../../config/database.js";

/**
 * GET /api/v1/health
 *
 * Stage 1 minimum API surface per
 * docs/implementation/GDN_Repository_And_Environment_Setup.md (section 18).
 * Now that the database foundation (Stage 1B/1C) is in place, this
 * also confirms the API can actually reach Postgres - a process that
 * is "up" but cannot reach its database is not healthy for
 * monitoring/orchestration purposes. Reports via the response body
 * (status 200/"ok" vs 503/"degraded") rather than throwing, since
 * that's what health probes expect to read.
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (request, reply) => {
    const base = {
      service: env.appName,
      environment: env.appEnv,
      version: env.apiVersion,
      timestamp: new Date().toISOString(),
    };

    if (!env.databaseUrl) {
      return { status: "ok", ...base, database: "not_configured" };
    }

    try {
      await getPool().query("SELECT 1");
      return { status: "ok", ...base, database: "connected" };
    } catch (error) {
      request.log.error(error);
      reply.status(503);
      return { status: "degraded", ...base, database: "unavailable" };
    }
  });
}
