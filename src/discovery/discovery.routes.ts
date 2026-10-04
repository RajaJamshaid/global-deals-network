import type { FastifyInstance } from "fastify";
import { unauthorized } from "../api/http/errors.js";
import { sendData } from "../api/http/response.js";
import { requireUuid } from "../api/http/validation.js";
import { requireUser } from "../user/telegram-auth.js";
import { discoverByBarcode, discoverByImage } from "./discovery.service.js";
import {
  MAX_IMAGE_BYTES,
  validateImageUpload,
  type ImageIdentificationProvider,
} from "./image-identification.js";

/**
 * Route pattern (without the /api/vN prefix) of the image-search upload.
 * It is exempt from the internal API key guard because it is a user-facing
 * action; it is protected by Telegram user authentication instead (the
 * plugin below enforces requireUser), which also keeps anonymous traffic
 * away from a future paid recognition provider.
 */
export const IMAGE_SEARCH_ROUTE_PATTERN = "/products/search/image";

/** Public barcode lookup. GET, so it never needs the internal API key. */
export async function barcodeRoutes(app: FastifyInstance): Promise<void> {
  app.get("/products/search/barcode", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const marketId = requireUuid(query, "market_id");
    const outcome = await discoverByBarcode(query.code, marketId);
    return sendData(reply, 200, outcome);
  });
}

/**
 * Image search: the request body is the raw image file
 * (Content-Type image/jpeg | image/png | image/webp), `market_id` in the
 * query. Raw bodies keep this free of a multipart dependency, and mean
 * there is no client filename to trust. Size is capped, the declared type
 * and the real file signature are both checked, and nothing is stored.
 */
export function createImageSearchRoutes(provider: ImageIdentificationProvider | null) {
  return async function imageSearchRoutes(app: FastifyInstance): Promise<void> {
    app.addHook("onRequest", requireUser);

    // Scoped to this plugin only; the JSON parser used everywhere else is untouched.
    app.addContentTypeParser(
      ["image/jpeg", "image/png", "image/webp"],
      { parseAs: "buffer", bodyLimit: MAX_IMAGE_BYTES },
      (_request, body, done) => done(null, body),
    );

    app.post(
      IMAGE_SEARCH_ROUTE_PATTERN,
      { bodyLimit: MAX_IMAGE_BYTES },
      async (request, reply) => {
        if (!request.user) throw unauthorized();
        const query = request.query as Record<string, unknown>;
        const marketId = requireUuid(query, "market_id");
        const image = validateImageUpload(request.body, request.headers["content-type"]);
        const outcome = await discoverByImage(image, marketId, provider);
        return sendData(reply, 200, outcome);
      },
    );
  };
}
