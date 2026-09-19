import type { FastifyInstance } from "fastify";
import { parsePagination } from "../api/http/pagination.js";
import { sendData, sendList } from "../api/http/response.js";
import { requireUuidParam } from "../api/http/validation.js";
import {
  createMerchantService,
  deactivateMerchantService,
  getMerchantService,
  listMerchantsService,
  updateMerchantService,
} from "./merchant.service.js";

export async function merchantRoutes(app: FastifyInstance): Promise<void> {
  app.get("/merchants", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await listMerchantsService(query, limit, offset);
    return sendList(reply, rows, { page, limit, total });
  });

  app.get("/merchants/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const merchantId = requireUuidParam(id, "merchant_id");
    const merchant = await getMerchantService(merchantId);
    return sendData(reply, 200, merchant);
  });

  app.post("/merchants", async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const merchant = await createMerchantService(body);
    return sendData(reply, 201, merchant);
  });

  app.patch("/merchants/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const merchantId = requireUuidParam(id, "merchant_id");
    const body = (request.body ?? {}) as Record<string, unknown>;
    const merchant = await updateMerchantService(merchantId, body);
    return sendData(reply, 200, merchant);
  });

  app.delete("/merchants/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const merchantId = requireUuidParam(id, "merchant_id");
    await deactivateMerchantService(merchantId);
    return reply.status(204).send();
  });
}
