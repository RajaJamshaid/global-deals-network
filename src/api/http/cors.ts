import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";

/**
 * Minimal CORS handling with no external dependency, per CODE QUALITY
 * ("avoid unnecessary dependencies") - a browser calling this API
 * cross-origin (the future Telegram Mini App frontend, once web/ is
 * built) needs the usual Access-Control-Allow-* response headers
 * before it can read the response; everything else (curl, the
 * Telegram webhook, server-to-server calls) has no Origin header and
 * is unaffected, since CORS is a browser-enforced concept only.
 *
 * Allowed origins are configuration (CORS_ALLOWED_ORIGINS), never
 * hard-coded, per docs/implementation/
 * GDN_Repository_And_Environment_Setup.md section 26 ("Initial
 * Security").
 */
export async function corsPlugin(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (!origin) {
      return;
    }

    reply.header("Vary", "Origin");

    if (env.corsAllowedOrigins.includes(origin)) {
      reply.header("Access-Control-Allow-Origin", origin);
      reply.header("Access-Control-Allow-Credentials", "true");
    }

    if (request.method === "OPTIONS") {
      reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return reply.status(204).send();
    }
  });
}
