import type { FastifyReply, FastifyRequest } from "fastify";
import { constantTimeEqual } from "./constant-time.js";
import { unauthorized } from "./errors.js";

/**
 * Internal write guard (deny-by-default).
 *
 * Every request whose method is not GET, HEAD or OPTIONS (so POST,
 * PATCH, PUT, DELETE and anything else) must carry
 *   Authorization: Bearer <GDN_INTERNAL_API_KEY>
 * unless its matched route is explicitly listed in `exemptRoutes`.
 * Because it is deny-by-default, a future write route is protected
 * automatically - nobody has to remember to add it.
 *
 * Fail closed: if the server has no key configured, every guarded
 * request is rejected with 401.
 *
 * This is deliberately NOT user authentication. It only lets trusted
 * internal writers (admin tooling, future feed importers) change
 * catalog/offer/price data. User-facing endpoints (e.g. the future
 * watchlist) must be added to `exemptRoutes` explicitly, together with
 * their own user authentication.
 *
 * The key is never logged and is never included in any response.
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export interface InternalWriteGuardOptions {
  /** Undefined = not configured, so every guarded request is rejected. */
  apiKey: string | undefined;
  /** Full route patterns (including the /api/vN prefix) that skip this guard. */
  exemptRoutes: readonly string[];
}

/** Returns the token of a well-formed "Bearer <token>" header, else undefined. */
export function extractBearerToken(header: unknown): string | undefined {
  if (typeof header !== "string") {
    return undefined;
  }
  const match = /^Bearer[ \t]+(\S+)$/i.exec(header.trim());
  return match?.[1];
}

export function createInternalWriteGuard(options: InternalWriteGuardOptions) {
  return async function internalWriteGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    if (SAFE_METHODS.has(request.method)) {
      return;
    }

    const route = request.routeOptions?.url;
    if (route !== undefined && options.exemptRoutes.includes(route)) {
      return;
    }

    reply.header("WWW-Authenticate", "Bearer");

    if (!options.apiKey) {
      // Never log the key (or the presented credential) - only the fact.
      request.log.warn(
        "GDN_INTERNAL_API_KEY is not configured; rejecting protected write request",
      );
      throw unauthorized();
    }

    const token = extractBearerToken(request.headers.authorization);
    if (token === undefined || !constantTimeEqual(token, options.apiKey)) {
      throw unauthorized();
    }
  };
}
