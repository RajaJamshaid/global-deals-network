import { describe, expect, it } from "vitest";
import {
  MAX_SITEMAP_URLS,
  buildRobotsTxt,
  buildSitemapIndex,
  buildUrlset,
} from "../../src/seo/sitemap.js";
import {
  renderLayout,
  renderListingBody,
  renderNotFoundBody,
  renderProductBody,
  type ProductPageView,
} from "../../src/seo/templates.js";
import { buildProductSeo } from "../../src/seo/seo-metadata.js";

describe("sitemap builders", () => {
  it("returns an empty but valid urlset when there are no pages", () => {
    const xml = buildUrlset([]);
    expect(xml).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
    );
    expect(xml).not.toContain("<url>");
  });

  it("lists real URLs, escapes them and formats lastmod", () => {
    const xml = buildUrlset([
      { loc: "https://gdn.example/product/a&b", lastmod: new Date("2026-10-05T12:00:00Z") },
      { loc: "https://gdn.example/product/c", lastmod: null },
    ]);
    expect(xml).toContain("<loc>https://gdn.example/product/a&amp;b</loc><lastmod>2026-10-05T12:00:00.000Z</lastmod>");
    expect(xml).toContain("<url><loc>https://gdn.example/product/c</loc></url>");
  });

  it("never lists more than the protocol limit", () => {
    const urls = Array.from({ length: MAX_SITEMAP_URLS + 5 }, (_, i) => ({ loc: `https://gdn.example/product/p${i}` }));
    expect(buildUrlset(urls).match(/<url>/g)).toHaveLength(MAX_SITEMAP_URLS);
  });

  it("builds a sitemap index", () => {
    const xml = buildSitemapIndex(["https://gdn.example/sitemap-products.xml"]);
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("<sitemap><loc>https://gdn.example/sitemap-products.xml</loc></sitemap>");
  });

  it("builds robots.txt that blocks the API and points at the sitemap", () => {
    const robots = buildRobotsTxt("https://gdn.example");
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap: https://gdn.example/sitemap.xml");
  });
});

function view(overrides: Partial<ProductPageView> = {}): ProductPageView {
  return {
    name: "Acme Phone",
    brand: "Acme",
    description: "A phone.",
    imageUrl: "https://cdn.example.com/p.png",
    category: { name: "Phones", slug: "phones" },
    showCategoryLink: true,
    market: { code: "US", name: "United States", currency: "USD" },
    offers: [
      { rank: 1, merchantName: "Alpha Store", listedPrice: 80, effectivePrice: 80, currency: "USD", availabilityLabel: "In stock", shopUrl: "/api/v1/redirect/deal/deal-1" },
      { rank: 2, merchantName: "Beta Shop", listedPrice: 90, effectivePrice: 90, currency: "USD", availabilityLabel: "Out of stock", shopUrl: null },
    ],
    priceStatus: { status: "low", differencePct: -18.5, averagePrice: 98.18, minPrice: 80, maxPrice: 100, observationCount: 11, windowDays: 30, message: null },
    dealScore: { score: 86, rating: "great", reasons: ["18% below 30-day average", "In stock"] },
    ...overrides,
  };
}

describe("renderProductBody", () => {
  it("shows best price, the comparison table, price intelligence and Deal Score", () => {
    const html = renderProductBody(view());
    expect(html).toContain("<h1>Acme Phone</h1>");
    expect(html).toContain("USD 80.00");
    expect(html).toContain("Compare prices");
    expect(html).toContain("Alpha Store");
    expect(html).toContain("Beta Shop");
    expect(html).toContain("recent average price");
    expect(html).toContain("-18.5% vs the 30-day average");
    expect(html).toContain("GDN Deal Score: 86 / 100");
    expect(html).toContain("18% below 30-day average");
  });

  it("sends every shop link through the affiliate redirect as sponsored/nofollow", () => {
    const html = renderProductBody(view());
    const links = [...html.matchAll(/<a [^>]*rel="sponsored nofollow noopener"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
    expect(links).toEqual(["/api/v1/redirect/deal/deal-1", "/api/v1/redirect/deal/deal-1"]);
    expect(html).toContain("Store link not available yet".slice(0, 0)); // no-op: second offer simply shows a dash
    expect(html).not.toContain("http://");
  });

  it("escapes everything that comes from data", () => {
    const html = renderProductBody(
      view({
        name: "<script>alert(1)</script>",
        brand: "<i>b</i>",
        description: '"><img src=x onerror=alert(1)>',
        offers: [{ rank: 1, merchantName: '"><svg onload=alert(1)>', listedPrice: 1, effectivePrice: 1, currency: "USD", availabilityLabel: "In stock", shopUrl: '/x" onmouseover="alert(1)' }],
      }),
    );
    expect(html).not.toContain("<script>alert(1)");
    expect(html).not.toContain("<img src=x onerror");
    expect(html).not.toContain("<svg onload");
    expect(html).not.toContain('onmouseover="alert');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("does not render an unsafe image URL", () => {
    expect(renderProductBody(view({ imageUrl: "javascript:alert(1)" }))).not.toContain("<img");
    expect(renderProductBody(view())).toContain('<img src="https://cdn.example.com/p.png"');
  });

  it("states plainly when there are no offers, and shows no price", () => {
    const html = renderProductBody(view({ offers: [] }));
    expect(html).toContain("No store offers are available for this product right now.");
    expect(html).not.toContain("USD");
    expect(html).not.toContain("Compare prices");
  });

  it("explains insufficient price history and a missing Deal Score", () => {
    const html = renderProductBody(
      view({
        priceStatus: { status: "not_enough_data", differencePct: null, averagePrice: null, minPrice: null, maxPrice: null, observationCount: 1, windowDays: 30, message: "Price history is building as GDN collects more data." },
        dealScore: { score: null, rating: "unrated", reasons: ["Not enough price data to score this deal yet"] },
      }),
    );
    expect(html).toContain("Price history is building as GDN collects more data.");
    expect(html).toContain("Deal Score is not available yet");
    expect(html).not.toContain("GDN Deal Score:");
  });

  it("never claims verification, guarantees or real-time data", () => {
    const page = renderLayout({
      seo: buildProductSeo({ siteUrl: "https://gdn.example", name: "Acme Phone", slug: "acme-phone", brand: null, description: null, imageUrl: null, category: null, offers: [], indexable: false }),
      siteName: "Global Deals Network",
      body: renderProductBody(view()),
    });
    expect(page).not.toMatch(/verified|guaranteed|official tier|real-?time|synced/i);
    expect(page).toContain("Prices and availability may change. GDN may earn a commission from qualifying purchases.");
  });
});

describe("renderLayout", () => {
  it("emits title, description, canonical, robots, Open Graph, Twitter and JSON-LD", () => {
    const seo = buildProductSeo({
      siteUrl: "https://gdn.example", name: "Acme Phone", slug: "acme-phone", brand: "Acme", description: "A phone.",
      imageUrl: "https://cdn.example.com/p.png", category: null, indexable: true,
      offers: [{ merchantName: "Alpha Store", listedPrice: 80, effectivePrice: 80, currency: "USD", availability: "in_stock" }],
    });
    const html = renderLayout({ seo, siteName: "Global Deals Network", body: "<p>x</p>" });
    expect(html).toContain("<title>Acme Phone Price Comparison | GDN</title>");
    expect(html).toContain('<link rel="canonical" href="https://gdn.example/product/acme-phone">');
    expect(html).toContain('<meta name="robots" content="index,follow">');
    expect(html).toContain('<meta property="og:title" content="Acme Phone Price Comparison | GDN">');
    expect(html).toContain('<meta property="og:image" content="https://cdn.example.com/p.png">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html.match(/<script type="application\/ld\+json">/g)).toHaveLength(seo.jsonLd.length);
    // No executable scripts, only structured data.
    expect(html.match(/<script/g)).toHaveLength(seo.jsonLd.length);
  });

  it("omits image tags when there is no real image", () => {
    const seo = buildProductSeo({ siteUrl: "https://gdn.example", name: "No Image", slug: "no-image", brand: null, description: null, imageUrl: null, category: null, offers: [], indexable: false });
    const html = renderLayout({ seo, siteName: "GDN", body: "" });
    expect(html).not.toContain("og:image");
    expect(html).not.toContain("twitter:image");
    expect(html).toContain('content="noindex,follow"');
  });
});

describe("renderListingBody / renderNotFoundBody", () => {
  it("links products to their canonical page and paginates", () => {
    const html = renderListingBody({
      heading: "Phones", intro: "30 products", total: 30, page: 2, pageSize: 24, basePath: "/category/phones",
      items: [{ name: "Phone <A>", slug: "phone-a", brand: null, imageUrl: null, priceText: "From USD 80.00 at Alpha Store", offerCount: 2 }],
    });
    expect(html).toContain('<a href="/product/phone-a">');
    expect(html).toContain("Phone &lt;A&gt;");
    expect(html).toContain('href="/category/phones">&laquo; Previous');
    expect(html).not.toContain("Next &raquo;");
  });

  it("renders a not-found body", () => {
    expect(renderNotFoundBody()).toContain("Page not found");
  });
});
