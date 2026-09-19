import type { FastifyInstance } from "fastify";
import { sendData } from "../api/http/response.js";
import { requireUuid, requireUuidParam } from "../api/http/validation.js";
import {
  generateAffiliateLinkForOffer,
  getAffiliateLinkService,
} from "./affiliate-link.service.js";

export async function affiliateRoutes(app: FastifyInstance): Promise<void> {
  app.post("/affiliate-links", async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const offerId = requireUuid(body, "offer_id");
    const { link, created } = await generateAffiliateLinkForOffer(offerId);
    return sendData(reply, created ? 201 : 200, link);
  });

  app.get("/affiliate-links/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const affiliateLinkId = requireUuidParam(id, "affiliate_link_id");
    const link = await getAffiliateLinkService(affiliateLinkId);
    return sendData(reply, 200, link);
  });
}
