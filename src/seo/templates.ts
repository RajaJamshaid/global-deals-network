import { escapeHtml, formatMoney, isHttpUrl, jsonLdScript, truncate } from "./html.js";
import type { PageSeo } from "./seo-metadata.js";

/**
 * Server-rendered HTML for the public SEO pages. Functional, not final
 * design: semantic markup and a little inline CSS, no JavaScript. Every
 * dynamic value is escaped; merchant CTAs only ever link to the central
 * affiliate redirect (never a raw merchant URL).
 */
const STYLES = `
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;color:#1a1c1a;background:#faf9f6}
header,main,footer{max-width:880px;margin:0 auto;padding:12px 16px}
header a{color:#1a1c1a;text-decoration:none;font-weight:700}
h1{font-size:1.6rem;margin:.4em 0}h2{font-size:1.15rem;margin:1.4em 0 .5em}
table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:.95rem}
.box{background:#fff;border:1px solid #e3e2df;border-radius:8px;padding:12px 14px;margin:12px 0}
.btn{display:inline-block;background:#1a1c1a;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;margin-right:8px}
.btn.secondary{background:#fff;color:#1a1c1a;border:1px solid #1a1c1a}
.muted{color:#4e4541;font-size:.9rem}img{max-width:240px;height:auto}
ul.items{list-style:none;padding:0}ul.items li{padding:8px 0;border-bottom:1px solid #eee}
`;

export interface LayoutInput {
  seo: PageSeo;
  siteName: string;
  body: string;
}

export function renderLayout(input: LayoutInput): string {
  const { seo } = input;
  const t = escapeHtml;
  const og = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${t(input.siteName)}">`,
    `<meta property="og:title" content="${t(seo.title)}">`,
    `<meta property="og:description" content="${t(seo.description)}">`,
    `<meta property="og:url" content="${t(seo.canonical)}">`,
    seo.ogImage ? `<meta property="og:image" content="${t(seo.ogImage)}">` : "",
    `<meta name="twitter:card" content="${seo.twitterCard}">`,
    `<meta name="twitter:title" content="${t(seo.title)}">`,
    `<meta name="twitter:description" content="${t(seo.description)}">`,
    seo.ogImage ? `<meta name="twitter:image" content="${t(seo.ogImage)}">` : "",
  ].filter(Boolean);

  return [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${t(seo.title)}</title>`,
    `<meta name="description" content="${t(seo.description)}">`,
    `<link rel="canonical" href="${t(seo.canonical)}">`,
    `<meta name="robots" content="${seo.robots}">`,
    ...og,
    ...seo.jsonLd.map((data) => jsonLdScript(data)),
    `<style>${STYLES}</style>`,
    "</head><body>",
    `<header><a href="/">${t(input.siteName)}</a> &middot; <a href="/search.html">Search</a></header>`,
    `<main>${input.body}</main>`,
    `<footer class="muted">Prices and availability may change. GDN may earn a commission from qualifying purchases.</footer>`,
    "</body></html>",
  ].join("\n");
}

export interface OfferView {
  rank: number;
  merchantName: string;
  listedPrice: number;
  effectivePrice: number;
  currency: string;
  availabilityLabel: string;
  /** Absolute or relative link to the central affiliate redirect; null = none available. */
  shopUrl: string | null;
}

export interface ProductPageView {
  name: string;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
  category: { name: string; slug: string } | null;
  showCategoryLink: boolean;
  market: { code: string; name: string; currency: string };
  offers: OfferView[];
  priceStatus: {
    status: "low" | "normal" | "high" | "not_enough_data";
    differencePct: number | null;
    averagePrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    observationCount: number;
    windowDays: number;
    message: string | null;
  };
  dealScore: { score: number | null; rating: string; reasons: string[] };
}

const STATUS_TEXT: Record<string, string> = {
  low: "Lower than this store's recent average price",
  normal: "In line with this store's recent average price",
  high: "Higher than this store's recent average price",
};

export function renderProductBody(view: ProductPageView): string {
  const t = escapeHtml;
  const best = view.offers[0];
  const parts: string[] = [];

  const crumbs = ['<a href="/">Home</a>'];
  if (view.category && view.showCategoryLink) {
    crumbs.push(`<a href="/category/${t(view.category.slug)}">${t(view.category.name)}</a>`);
  }
  crumbs.push(t(view.name));
  parts.push(`<nav class="muted" aria-label="Breadcrumb">${crumbs.join(" &rsaquo; ")}</nav>`);

  parts.push(`<h1>${t(view.name)}</h1>`);
  if (view.brand) parts.push(`<p class="muted">Brand: ${t(view.brand)}</p>`);
  if (isHttpUrl(view.imageUrl)) {
    parts.push(`<img src="${t(view.imageUrl)}" alt="${t(view.name)}" loading="lazy">`);
  }
  if (view.description) parts.push(`<p>${t(truncate(view.description, 600))}</p>`);

  if (!best) {
    parts.push(
      `<div class="box"><strong>No store offers are available for this product right now.</strong>` +
        `<p class="muted">Check back later, or <a href="/search.html">search for another product</a>.</p></div>`,
    );
    return parts.join("\n");
  }

  const bestShop = best.shopUrl
    ? `<a class="btn" rel="sponsored nofollow noopener" href="${t(best.shopUrl)}">Shop at ${t(best.merchantName)}</a>`
    : `<span class="muted">Store link not available yet</span>`;
  parts.push(
    `<div class="box" id="best-price"><div class="muted">Best available price in ${t(view.market.name)}</div>` +
      `<div style="font-size:1.6rem;font-weight:700">${t(formatMoney(best.effectivePrice, best.currency))}</div>` +
      `<div>at ${t(best.merchantName)} &middot; ${t(best.availabilityLabel)}</div>` +
      `<p><a class="btn secondary" href="#compare">Compare prices</a>${bestShop}</p></div>`,
  );

  const rows = view.offers
    .map((offer) => {
      const shop = offer.shopUrl
        ? `<a rel="sponsored nofollow noopener" href="${t(offer.shopUrl)}">Shop</a>`
        : "&mdash;";
      return (
        `<tr><td>${offer.rank}</td><td>${t(offer.merchantName)}</td>` +
        `<td>${t(formatMoney(offer.listedPrice, offer.currency))}</td>` +
        `<td>${t(formatMoney(offer.effectivePrice, offer.currency))}</td>` +
        `<td>${t(offer.availabilityLabel)}</td><td>${shop}</td></tr>`
      );
    })
    .join("");
  parts.push(
    `<section id="compare"><h2>Compare prices (${t(view.market.currency)}, ${t(view.market.name)})</h2>` +
      `<table><thead><tr><th>#</th><th>Store</th><th>Listed price</th><th>Effective price</th><th>Availability</th><th></th></tr></thead>` +
      `<tbody>${rows}</tbody></table>` +
      `<p class="muted">Offers are ordered by availability, then effective price. Shipping, coupons and cashback are not included.</p></section>`,
  );

  const ps = view.priceStatus;
  const intel: string[] = ["<h2>Price intelligence</h2>"];
  if (ps.status === "not_enough_data") {
    intel.push(`<p>${t(ps.message ?? "Price history is building as GDN collects more data.")}</p>`);
  } else {
    intel.push(`<p>${t(STATUS_TEXT[ps.status] ?? "")}.</p>`);
    const stats: string[] = [];
    if (ps.differencePct !== null) stats.push(`${ps.differencePct > 0 ? "+" : ""}${ps.differencePct}% vs the ${ps.windowDays}-day average`);
    if (ps.averagePrice !== null) stats.push(`average ${formatMoney(ps.averagePrice, best.currency)}`);
    if (ps.minPrice !== null && ps.maxPrice !== null) {
      stats.push(`range ${formatMoney(ps.minPrice, best.currency)} - ${formatMoney(ps.maxPrice, best.currency)}`);
    }
    stats.push(`${ps.observationCount} stored price observations`);
    intel.push(`<p class="muted">${t(stats.join(" \u00b7 "))}</p>`);
  }
  const ds = view.dealScore;
  if (ds.score !== null) {
    intel.push(
      `<p><strong>GDN Deal Score: ${ds.score} / 100</strong></p><p class="muted">Why this score?</p>` +
        `<ul>${ds.reasons.map((reason) => `<li>${t(reason)}</li>`).join("")}</ul>`,
    );
  } else {
    intel.push(`<p class="muted">Deal Score is not available yet: there is not enough real price data.</p>`);
  }
  parts.push(`<section id="intelligence">${intel.join("")}</section>`);

  return parts.join("\n");
}

export interface ListingItemView {
  name: string;
  slug: string;
  brand: string | null;
  imageUrl: string | null;
  /** "USD 94.99 at Store" style text, or null when no price is shown. */
  priceText: string | null;
  offerCount: number;
}

export interface ListingPageView {
  heading: string;
  intro: string;
  items: ListingItemView[];
  total: number;
  page: number;
  pageSize: number;
  basePath: string;
}

export function renderListingBody(view: ListingPageView): string {
  const t = escapeHtml;
  const items = view.items
    .map(
      (item) =>
        `<li><a href="/product/${t(item.slug)}"><strong>${t(item.name)}</strong></a>` +
        `${item.brand ? ` <span class="muted">${t(item.brand)}</span>` : ""}` +
        `${item.priceText ? `<div>${t(item.priceText)}${item.offerCount > 1 ? ` <span class="muted">(${item.offerCount} offers)</span>` : ""}</div>` : ""}</li>`,
    )
    .join("");
  const pages = Math.ceil(view.total / view.pageSize);
  const nav: string[] = [];
  if (view.page > 1) {
    nav.push(`<a href="${t(view.basePath)}${view.page - 1 > 1 ? `?page=${view.page - 1}` : ""}">&laquo; Previous</a>`);
  }
  if (view.page < pages) {
    nav.push(`<a href="${t(view.basePath)}?page=${view.page + 1}">Next &raquo;</a>`);
  }
  return (
    `<h1>${t(view.heading)}</h1><p class="muted">${t(view.intro)}</p>` +
    `<ul class="items">${items}</ul>` +
    (nav.length > 0 ? `<p>${nav.join(" &middot; ")}</p>` : "")
  );
}

export function renderNotFoundBody(): string {
  return (
    `<h1>Page not found</h1><p>We could not find that page. ` +
    `<a href="/search.html">Search for a product</a>.</p>`
  );
}
