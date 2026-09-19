import type { FastifyInstance } from "fastify";
import { parsePagination } from "../api/http/pagination.js";
import { sendData, sendList } from "../api/http/response.js";
import { requireUuidParam } from "../api/http/validation.js";
import {
  createOfferService,
  deactivateOfferService,
  getOfferService,
  listOffersService,
  updateOfferService,
} from "./offer.service.js";

export async function offerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/offers", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await listOffersService(query, limit, offset);
    return sendList(reply, rows, { page, limit, total });
  });

  app.get("/offers/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const offerId = requireUuidParam(id, "offer_id");
    const offer = await getOfferService(offerId);
    return sendData(reply, 200, offer);
  });

  app.post("/offers", async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const offer = await createOfferService(body);
    return sendData(reply, 201, offer);
  });

  app.patch("/offers/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const offerId = requireUuidParam(id, "offer_id");
    const body = (request.body ?? {}) as Record<string, unknown>;
    const offer = await updateOfferService(offerId, body);
    return sendData(reply, 200, offer);
  });

  app.delete("/offers/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const offerId = requireUuidParam(id, "offer_id");
    await deactivateOfferService(offerId);
    return reply.status(204).send();
  });
}
