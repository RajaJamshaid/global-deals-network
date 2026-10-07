import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import {
  categoriesSitemapXml,
  productsSitemapXml,
  renderCategoryPageService,
  renderProductPageService,
  renderStorePageService,
  robotsTxt,
  sitemapIndexXml,
  storesSitemapXml,
  type SeoConfig,
  type SeoResponse,
} from "./seo.service.js";

/**
 * Public, crawlable pages (outside /api): product, category and store
 * landing pages, sitemaps and robots.txt. Anonymous and read-only - no
 * Telegram, signup or app needed. HTML responses carry a strict
 * Content-Security-Policy (no scripts at all) as defence in depth on top of
 * escaping every dynamic value.
 */
const HTML_SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
} as const;

function send(reply: FastifyReply, outcome: SeoResponse): FastifyReply {
  switch (outcome.kind) {
    case "html":
      return reply
        .status(outcome.status)
        .headers({
          ...HTML_SECURITY_HEADERS,
          "Cache-Control": outcome.status === 200 ? "public, max-age=300" : "public, max-age=60",
        })
        .type("text/html; charset=utf-8")
        .send(outcome.html);
    case "redirect":
      return reply.redirect(301, outcome.location);
    case "xml":
      return reply
        .headers({ "Cache-Control": "public, max-age=900", "X-Content-Type-Options": "nosniff" })
        .type("application/xml; charset=utf-8")
        .send(outcome.xml);
    case "text":
      return reply
        .headers({ "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" })
        .type("text/plain; charset=utf-8")
        .send(outcome.text);
  }
}

export async function seoRoutes(app: FastifyInstance): Promise<void> {
  const config: SeoConfig = {
    siteUrl: env.siteUrl,
    publicApiUrl: env.publicApiUrl,
    defaultMarketCode: env.defaultMarketCode,
  };

  /** Runs a page producer; any failure becomes a generic, uncached 503 page (no details leaked). */
  async function respond(
    request: FastifyRequest,
    reply: FastifyReply,
    produce: () => Promise<SeoResponse>,
  ): Promise<FastifyReply> {
    try {
      return send(reply, await produce());
    } catch (error) {
      request.log.error({ err: error instanceof Error ? error.message : "unknown" }, "SEO page failed");
      return reply
        .status(503)
        .headers({ ...HTML_SECURITY_HEADERS, "Cache-Control": "no-store", "Retry-After": "60" })
        .type("text/html; charset=utf-8")
        .send("<!doctype html><title>Temporarily unavailable</title><p>This page is temporarily unavailable.</p>");
    }
  }

  const query = (request: FastifyRequest): Record<string, unknown> =>
    request.query as Record<string, unknown>;

  app.get("/product/:slug", (request, reply) =>
    respond(request, reply, () =>
      renderProductPageService((request.params as { slug: string }).slug, query(request), config),
    ),
  );
  app.get("/category/:slug", (request, reply) =>
    respond(request, reply, () =>
      renderCategoryPageService((request.params as { slug: string }).slug, query(request), config),
    ),
  );
  app.get("/store/:slug", (request, reply) =>
    respond(request, reply, () =>
      renderStorePageService((request.params as { slug: string }).slug, query(request), config),
    ),
  );

  app.get("/sitemap.xml", (request, reply) =>
    respond(request, reply, async () => ({ kind: "xml", xml: sitemapIndexXml(config) })),
  );
  app.get("/sitemap-products.xml", (request, reply) =>
    respond(request, reply, async () => ({ kind: "xml", xml: await productsSitemapXml(config) })),
  );
  app.get("/sitemap-categories.xml", (request, reply) =>
    respond(request, reply, async () => ({ kind: "xml", xml: await categoriesSitemapXml(config) })),
  );
  app.get("/sitemap-stores.xml", (request, reply) =>
    respond(request, reply, async () => ({ kind: "xml", xml: await storesSitemapXml(config) })),
  );
  app.get("/robots.txt", (request, reply) =>
    respond(request, reply, async () => ({ kind: "text", text: robotsTxt(config) })),
  );
}
