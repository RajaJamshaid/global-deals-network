import type { FastifyInstance } from "fastify";
import { notFound } from "../api/http/errors.js";
import { parsePagination } from "../api/http/pagination.js";
import { sendData, sendList } from "../api/http/response.js";
import { requireUuidParam } from "../api/http/validation.js";
import { getCategoryById, listCategories } from "./category.repository.js";

/** Read-only reference data - same reasoning as market.routes.ts. */
export async function categoryRoutes(app: FastifyInstance): Promise<void> {
  app.get("/categories", async (request, reply) => {
    const { page, limit, offset } = parsePagination(
      request.query as Record<string, unknown>,
    );
    const { rows, total } = await listCategories(limit, offset);
    return sendList(reply, rows, { page, limit, total });
  });

  app.get("/categories/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const categoryId = requireUuidParam(id, "category_id");
    const category = await getCategoryById(categoryId);
    if (!category) {
      throw notFound("Category");
    }
    return sendData(reply, 200, category);
  });
}
