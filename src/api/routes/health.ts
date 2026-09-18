import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";

/**
 * GET /api/v1/health
 *
 * Stage 1 minimum API surface per
 * docs/implementation/GDN_Repository_And_Environment_Setup.md (section 18).
 * Confirms the API process is running. No database dependency yet -
 * database connectivity checks will be added when the database
 * foundation (Phase 1 of the Master Roadmap) is implemented.
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    return {
      status: "ok",
      service: env.appName,
      environment: env.appEnv,
      version: env.apiVersion,
      timestamp: new Date().toISOString(),
    };
  });
}
