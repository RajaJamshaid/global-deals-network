import type { FastifyInstance } from "fastify";
import { getProductComparisonService } from "./product-comparison.service.js";
import { parsePagination } from "../api/http/pagination.js";
import { badRequest } from "../api/http/errors.js";
import { sendData, sendList } from "../api/http/response.js";
import { requireUuidParam } from "../api/http/validation.js";
import {
  createProductService,
  deactivateProductService,
  getProductService,
  listProductsService,
  updateProductService,
} from "./product.service.js";

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get("/products", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await listProductsService(query, limit, offset);
    return sendList(reply, rows, { page, limit, total });
  });

  app.get("/products/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const productId = requireUuidParam(id, "product_id");
    const product = await getProductService(productId);
    return sendData(reply, 200, product);
  });

  // Stage 1D: price comparison across active offers for this product
  // within one market. market_id is required so results are never
  // mixed across markets/currencies - see
  // product-comparison.service.ts.
  app.get("/products/:id/comparison", async (request, reply) => {
    const { id } = request.params as { id: string };
    const productId = requireUuidParam(id, "product_id");
    const query = request.query as Record<string, unknown>;
    if (typeof query.market_id !== "string") {
      throw badRequest("market_id query parameter is required");
    }
    const marketId = requireUuidParam(query.market_id, "market_id");
    const comparison = await getProductComparisonService(productId, marketId);
    return sendData(reply, 200, comparison);
  });

  app.post("/products", async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const product = await createProductService(body);
    return sendData(reply, 201, product);
  });

  app.patch("/products/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const productId = requireUuidParam(id, "product_id");
    const body = (request.body ?? {}) as Record<string, unknown>;
    const product = await updateProductService(productId, body);
    return sendData(reply, 200, product);
  });

  // Deactivates (status = 'inactive') rather than physically deleting -
  // see the comment on deactivateProduct() in product.repository.ts.
  app.delete("/products/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const productId = requireUuidParam(id, "product_id");
    await deactivateProductService(productId);
    return reply.status(204).send();
  });
}
