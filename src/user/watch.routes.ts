import type { FastifyInstance } from "fastify";
import { unauthorized } from "../api/http/errors.js";
import { parsePagination } from "../api/http/pagination.js";
import { sendData, sendList } from "../api/http/response.js";
import { requireUuidParam } from "../api/http/validation.js";
import { requireUser } from "./telegram-auth.js";
import {
  getWatchlistService,
  unwatchProductService,
  watchProductService,
} from "./watch.service.js";

/**
 * Route pattern (without the /api/vN prefix) that is exempt from the
 * internal API key guard: it is authenticated by Telegram user auth
 * instead. See api/server.ts.
 */
export const WATCH_ROUTE_PATTERN = "/products/:id/watch";

/**
 * User-scoped routes. The plugin-level hook means EVERY route
 * registered here requires a verified Telegram user (401 otherwise), and
 * every query is scoped to that user's id. The user id always comes from
 * request.user (verified initData), never from the request body.
 */
export async function watchRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", requireUser);

  // Create or update the caller's watch (optional target price).
  app.post(WATCH_ROUTE_PATTERN, async (request, reply) => {
    const user = request.user;
    if (!user) throw unauthorized();
    const { id } = request.params as { id: string };
    const productId = requireUuidParam(id, "product_id");
    const body = (request.body ?? {}) as Record<string, unknown>;
    const { watch, created } = await watchProductService(user.userId, productId, body);
    return sendData(reply, created ? 201 : 200, watch);
  });

  // Remove (deactivate) only the caller's own watch.
  app.delete(WATCH_ROUTE_PATTERN, async (request, reply) => {
    const user = request.user;
    if (!user) throw unauthorized();
    const { id } = request.params as { id: string };
    const productId = requireUuidParam(id, "product_id");
    const query = request.query as Record<string, unknown>;
    await unwatchProductService(user.userId, productId, query);
    return reply.status(204).send();
  });

  // The caller's watchlist for one market.
  app.get("/users/me/watchlist", async (request, reply) => {
    const user = request.user;
    if (!user) throw unauthorized();
    const query = request.query as Record<string, unknown>;
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await getWatchlistService(user.userId, query, limit, offset);
    return sendList(reply, rows, { page, limit, total });
  });
}
