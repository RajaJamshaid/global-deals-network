/**
 * Shared helper for the Cloudflare Pages Functions that serve GDN's
 * server-rendered SEO pages (product, category and store landing pages,
 * sitemaps, robots.txt) under the website's own domain.
 *
 * Why a proxy: the website is static (Cloudflare Pages) while the pages are
 * rendered by the GDN API. For Google to index them on the site's domain,
 * those paths must be answered from there. This forwards ONLY these GET
 * paths to the API origin; nothing else (and no /api traffic) goes through
 * it, and no credentials are forwarded.
 *
 * Configure the origin with the Pages environment variable GDN_API_ORIGIN
 * (defaults to the GDN API on Render).
 */
const DEFAULT_ORIGIN = "https://global-deals-network.onrender.com";

const PASS_THROUGH_HEADERS = [
  "content-type",
  "cache-control",
  "location",
  "content-security-policy",
  "x-content-type-options",
  "referrer-policy",
  "retry-after",
];

export async function proxyToGdn(context) {
  const configured = context.env && context.env.GDN_API_ORIGIN;
  const origin = String(configured || DEFAULT_ORIGIN).replace(/\/+$/, "");
  const url = new URL(context.request.url);

  let upstream;
  try {
    upstream = await fetch(origin + url.pathname + url.search, {
      method: "GET",
      headers: { Accept: context.request.headers.get("accept") || "*/*" },
      redirect: "manual",
    });
  } catch (error) {
    return new Response("This page is temporarily unavailable.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "retry-after": "60" },
    });
  }

  const headers = new Headers();
  for (const name of PASS_THROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
