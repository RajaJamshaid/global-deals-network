import type { FastifyInstance } from "fastify";
import { parsePagination } from "../api/http/pagination.js";
import { sendData, sendList } from "../api/http/response.js";
import { requireUuidParam } from "../api/http/validation.js";
import {
  archiveDealService,
  createDealService,
  getDealService,
  listDealsService,
  updateDealService,
} from "./deal.service.js";

export async function dealRoutes(app: FastifyInstance): Promise<void> {
  app.get("/deals", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await listDealsService(query, limit, offset);
    return sendList(reply, rows, { page, limit, total });
  });

  app.get("/deals/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const dealId = requireUuidParam(id, "deal_id");
    const deal = await getDealService(dealId);
    return sendData(reply, 200, deal);
  });

  app.post("/deals", async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const deal = await createDealService(body);
    return sendData(reply, 201, deal);
  });

  app.patch("/deals/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const dealId = requireUuidParam(id, "deal_id");
    const body = (request.body ?? {}) as Record<string, unknown>;
    const deal = await updateDealService(dealId, body);
    return sendData(reply, 200, deal);
  });

  // Archives (deal_status = 'archived') rather than physically
  // deleting - see archiveDeal() in deal.repository.ts.
  app.delete("/deals/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const dealId = requireUuidParam(id, "deal_id");
    await archiveDealService(dealId);
    return reply.status(204).send();
  });
}
