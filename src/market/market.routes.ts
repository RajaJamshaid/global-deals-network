import type { FastifyInstance } from "fastify";
import { notFound } from "../api/http/errors.js";
import { parsePagination } from "../api/http/pagination.js";
import { sendData, sendList } from "../api/http/response.js";
import { requireUuidParam } from "../api/http/validation.js";
import { getMarketById, listMarkets } from "./market.repository.js";

/**
 * Read-only, per the Stage 1C task ("Markets and categories are
 * foundational reference data... do not create unnecessary public
 * mutation endpoints"). No service layer either - there's no
 * business logic between the route and the repository for a plain
 * read.
 */
export async function marketRoutes(app: FastifyInstance): Promise<void> {
  app.get("/markets", async (request, reply) => {
    const { page, limit, offset } = parsePagination(
      request.query as Record<string, unknown>,
    );
    const { rows, total } = await listMarkets(limit, offset);
    return sendList(reply, rows, { page, limit, total });
  });

  app.get("/markets/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const marketId = requireUuidParam(id, "market_id");
    const market = await getMarketById(marketId);
    if (!market) {
      throw notFound("Market");
    }
    return sendData(reply, 200, market);
  });
}
