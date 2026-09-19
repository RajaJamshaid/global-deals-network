import type { FastifyInstance } from "fastify";
import { requireUuidParam } from "../api/http/validation.js";
import { resolveDealRedirect } from "./redirect.service.js";

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * GET /api/v1/redirect/deal/:dealId
 *
 * Route path matches docs/architecture/GDN_API_Architecture.md's
 * documented affiliate redirect endpoint exactly, per the Stage 1D
 * task's "Use the existing architecture's preferred naming".
 *
 * No route in this file ever reads a URL to redirect to from the
 * request - only a dealId path param used as a lookup key. See
 * redirect.service.ts's resolveDealRedirect for why this closes off
 * the open-redirect risk entirely.
 */
export async function redirectRoutes(app: FastifyInstance): Promise<void> {
  app.get("/redirect/deal/:dealId", async (request, reply) => {
    const { dealId } = request.params as { dealId: string };
    const validDealId = requireUuidParam(dealId, "deal_id");
    const query = request.query as Record<string, unknown>;

    const result = await resolveDealRedirect(validDealId, {
      channel: stringOrUndefined(query.channel),
      sessionId: stringOrUndefined(query.session_id),
      campaignId: stringOrUndefined(query.campaign_id),
      placement: stringOrUndefined(query.placement),
      deviceType: stringOrUndefined(request.headers["user-agent"]),
      referrer: stringOrUndefined(request.headers.referer ?? request.headers.referrer),
    });

    return reply.redirect(302, result.redirectUrl);
  });
}
