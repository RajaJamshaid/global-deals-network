import { formatMoney, isHttpUrl, truncate } from "./html.js";

/**
 * SEO metadata and schema.org structured data. Pure functions: they take
 * only real GDN data and return metadata, so they are easy to test and can
 * never invent anything. Fields without real backing data are OMITTED
 * (no ratings, reviews, aggregate ratings, seller details beyond the
 * merchant's name, or availability that GDN does not know).
 */
export type SeoAvailability = "in_stock" | "out_of_stock" | "unknown";

export interface SeoOffer {
  merchantName: string;
  listedPrice: number;
  effectivePrice: number;
  currency: string;
  availability: SeoAvailability;
}

export interface PageSeo {
  title: string;
  description: string;
  canonical: string;
  robots: "index,follow" | "noindex,follow";
  ogImage: string | null;
  twitterCard: "summary" | "summary_large_image";
  jsonLd: Array<Record<string, unknown>>;
}

export interface ProductSeoInput {
  siteUrl: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
  category: { name: string; slug: string } | null;
  /** REAL offers only (sample/fixture offers excluded), best first. */
  offers: SeoOffer[];
  /** Only default-market pages with real offers should be indexed. */
  indexable: boolean;
}

const AVAILABILITY_URLS: Record<Exclude<SeoAvailability, "unknown">, string> = {
  in_stock: "https://schema.org/InStock",
  out_of_stock: "https://schema.org/OutOfStock",
};

function price(amount: number): string {
  return amount.toFixed(2);
}

function organization(siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Global Deals Network",
    url: siteUrl,
  };
}

function breadcrumbs(
  items: Array<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildProductSeo(input: ProductSeoInput): PageSeo {
  const canonical = `${input.siteUrl}/product/${input.slug}`;
  const offers = input.offers;
  const best = offers[0];
  const ogImage = isHttpUrl(input.imageUrl) ? input.imageUrl : null;

  const title = best
    ? `${truncate(input.name, 60)} Price Comparison | GDN`
    : `${truncate(input.name, 70)} | GDN`;

  const description = truncate(
    best
      ? `Compare ${offers.length === 1 ? "the price" : `${offers.length} store prices`} for ${input.name}. ` +
          `Best available price: ${formatMoney(best.effectivePrice, best.currency)} at ${best.merchantName}. ` +
          "Prices and availability may change."
      : `${input.name}${input.brand ? ` by ${input.brand}` : ""} on Global Deals Network. ` +
          "No store offers are available right now.",
    160,
  );

  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    url: canonical,
  };
  if (input.description) product.description = truncate(input.description, 500);
  if (ogImage) product.image = [ogImage];
  if (input.brand) product.brand = { "@type": "Brand", name: input.brand };
  if (best) {
    // One market means one currency; offers in another currency are never mixed in.
    const sameCurrency = offers.filter((offer) => offer.currency === best.currency);
    const prices = sameCurrency.map((offer) => offer.effectivePrice);
    product.offers = {
      "@type": "AggregateOffer",
      priceCurrency: best.currency,
      lowPrice: price(Math.min(...prices)),
      highPrice: price(Math.max(...prices)),
      offerCount: sameCurrency.length,
      offers: sameCurrency.map((offer) => {
        const entry: Record<string, unknown> = {
          "@type": "Offer",
          price: price(offer.effectivePrice),
          priceCurrency: offer.currency,
          seller: { "@type": "Organization", name: offer.merchantName },
          url: canonical,
        };
        if (offer.availability !== "unknown") {
          entry.availability = AVAILABILITY_URLS[offer.availability];
        }
        return entry;
      }),
    };
  }

  const crumbs = [{ name: "Home", url: `${input.siteUrl}/` }];
  if (input.category && input.indexable) {
    crumbs.push({
      name: input.category.name,
      url: `${input.siteUrl}/category/${input.category.slug}`,
    });
  }
  crumbs.push({ name: input.name, url: canonical });

  return {
    title,
    description,
    canonical,
    robots: input.indexable ? "index,follow" : "noindex,follow",
    ogImage,
    twitterCard: ogImage ? "summary_large_image" : "summary",
    jsonLd: [organization(input.siteUrl), breadcrumbs(crumbs), product],
  };
}

export interface ListingSeoInput {
  siteUrl: string;
  kind: "category" | "store";
  name: string;
  slug: string;
  marketName: string;
  /** The products shown on this page (real offers only). */
  items: Array<{ name: string; slug: string }>;
  /** All qualifying products, across pages. */
  total: number;
  page: number;
}

export function buildListingSeo(input: ListingSeoInput): PageSeo {
  const base = `${input.siteUrl}/${input.kind}/${input.slug}`;
  const canonical = input.page > 1 ? `${base}?page=${input.page}` : base;
  const noun = input.total === 1 ? "product" : "products";
  const pageSuffix = input.page > 1 ? ` - Page ${input.page}` : "";

  const title = `${truncate(input.name, 60)} Price Comparison${pageSuffix} | GDN`;
  const description = truncate(
    input.kind === "category"
      ? `Compare prices on ${input.total} ${input.name} ${noun} in ${input.marketName}. Prices and availability may change.`
      : `Compare prices on ${input.total} ${noun} offered by ${input.name} in ${input.marketName}. Prices and availability may change.`,
    160,
  );

  const jsonLd: Array<Record<string, unknown>> = [
    organization(input.siteUrl),
    breadcrumbs([
      { name: "Home", url: `${input.siteUrl}/` },
      { name: input.name, url: base },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: `${input.siteUrl}/product/${item.slug}`,
      })),
    },
  ];
  if (input.kind === "store") {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: input.name,
      url: base,
    });
  }

  return {
    title,
    description,
    canonical,
    robots: "index,follow",
    ogImage: null,
    twitterCard: "summary",
    jsonLd,
  };
}
