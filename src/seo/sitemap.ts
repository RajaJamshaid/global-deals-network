import { escapeXml } from "./html.js";

/**
 * Sitemap and robots.txt builders (pure). Only real canonical URLs are
 * ever passed in, so an empty catalogue produces an empty but valid
 * sitemap rather than any placeholder pages.
 */
export interface SitemapUrl {
  loc: string;
  lastmod?: Date | null;
}

/** The sitemap protocol allows at most 50,000 URLs per file. */
export const MAX_SITEMAP_URLS = 50_000;

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

export function buildUrlset(urls: readonly SitemapUrl[]): string {
  const entries = urls
    .slice(0, MAX_SITEMAP_URLS)
    .map((url) => {
      const lastmod =
        url.lastmod && !Number.isNaN(url.lastmod.getTime())
          ? `<lastmod>${url.lastmod.toISOString()}</lastmod>`
          : "";
      return `<url><loc>${escapeXml(url.loc)}</loc>${lastmod}</url>`;
    })
    .join("");
  return `${XML_HEADER}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export function buildSitemapIndex(locs: readonly string[]): string {
  const entries = locs.map((loc) => `<sitemap><loc>${escapeXml(loc)}</loc></sitemap>`).join("");
  return `${XML_HEADER}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export function buildRobotsTxt(siteUrl: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");
}
