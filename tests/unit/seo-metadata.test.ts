import { describe, expect, it } from "vitest";
import {
  buildListingSeo,
  buildProductSeo,
  type ProductSeoInput,
  type SeoOffer,
} from "../../src/seo/seo-metadata.js";

const SITE = "https://gdn.example";

const alpha: SeoOffer = { merchantName: "Alpha Store", listedPrice: 94.99, effectivePrice: 94.99, currency: "USD", availability: "in_stock" };
const beta: SeoOffer = { merchantName: "Beta Shop", listedPrice: 99.99, effectivePrice: 99.99, currency: "USD", availability: "out_of_stock" };
const gamma: SeoOffer = { merchantName: "Gamma Mart", listedPrice: 102, effectivePrice: 102, currency: "USD", availability: "unknown" };

function input(overrides: Partial<ProductSeoInput> = {}): ProductSeoInput {
  return {
    siteUrl: SITE,
    name: "Acme Phone 128GB",
    slug: "acme-phone-128gb",
    brand: "Acme",
    description: "A phone.",
    imageUrl: "https://cdn.example.com/phone.png",
    category: { name: "Phones", slug: "phones" },
    offers: [alpha, beta, gamma],
    indexable: true,
    ...overrides,
  };
}

function productLd(seo: ReturnType<typeof buildProductSeo>): Record<string, any> {
  return seo.jsonLd.find((entry) => entry["@type"] === "Product") as Record<string, any>;
}

describe("buildProductSeo - title, description, canonical", () => {
  it("generates a unique title from the product name", () => {
    expect(buildProductSeo(input()).title).toBe("Acme Phone 128GB Price Comparison | GDN");
  });

  it("shortens very long names so the title stays reasonable", () => {
    const seo = buildProductSeo(input({ name: "X".repeat(200) }));
    expect(seo.title.length).toBeLessThanOrEqual(60 + " Price Comparison | GDN".length);
    expect(seo.title.endsWith("Price Comparison | GDN")).toBe(true);
  });

  it("does not promise a comparison when there are no offers", () => {
    const seo = buildProductSeo(input({ offers: [] }));
    expect(seo.title).toBe("Acme Phone 128GB | GDN");
    expect(seo.description).toContain("No store offers are available right now");
  });

  it("builds the description from real comparison data", () => {
    const { description } = buildProductSeo(input());
    expect(description).toContain("Compare 3 store prices for Acme Phone 128GB.");
    expect(description).toContain("Best available price: USD 94.99 at Alpha Store.");
    expect(description).toContain("Prices and availability may change.");
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("uses singular wording for a single offer", () => {
    expect(buildProductSeo(input({ offers: [alpha] })).description).toContain("Compare the price for");
  });

  it("makes the canonical URL the stable /product/:slug page", () => {
    expect(buildProductSeo(input()).canonical).toBe(`${SITE}/product/acme-phone-128gb`);
  });

  it("only makes indexable pages indexable", () => {
    expect(buildProductSeo(input()).robots).toBe("index,follow");
    expect(buildProductSeo(input({ indexable: false })).robots).toBe("noindex,follow");
  });

  it("never uses claims GDN cannot back up", () => {
    const everything = JSON.stringify(buildProductSeo(input()));
    expect(everything).not.toMatch(/verified|guaranteed|official|real-?time|synced|lowest price guarantee/i);
  });
});

describe("buildProductSeo - Open Graph image and Twitter card", () => {
  it("uses the product image when it is an absolute http(s) URL", () => {
    const seo = buildProductSeo(input());
    expect(seo.ogImage).toBe("https://cdn.example.com/phone.png");
    expect(seo.twitterCard).toBe("summary_large_image");
  });

  it("drops unsafe or relative image URLs instead of emitting them", () => {
    for (const imageUrl of ["javascript:alert(1)", "/img.png", "data:image/png;base64,AAAA", null]) {
      const seo = buildProductSeo(input({ imageUrl }));
      expect(seo.ogImage).toBeNull();
      expect(seo.twitterCard).toBe("summary");
      expect(productLd(seo).image).toBeUndefined();
    }
  });
});

describe("buildProductSeo - structured data", () => {
  it("emits Organization, BreadcrumbList and Product", () => {
    const seo = buildProductSeo(input());
    expect(seo.jsonLd.map((entry) => entry["@type"])).toEqual(["Organization", "BreadcrumbList", "Product"]);
    expect(seo.jsonLd[0]).toMatchObject({ name: "Global Deals Network", url: SITE });
  });

  it("describes the real offers as an AggregateOffer", () => {
    const offers = productLd(buildProductSeo(input())).offers;
    expect(offers["@type"]).toBe("AggregateOffer");
    expect(offers).toMatchObject({ priceCurrency: "USD", lowPrice: "94.99", highPrice: "102.00", offerCount: 3 });
    expect(offers.offers.map((offer: any) => offer.seller.name)).toEqual(["Alpha Store", "Beta Shop", "Gamma Mart"]);
    expect(offers.offers.map((offer: any) => offer.price)).toEqual(["94.99", "99.99", "102.00"]);
  });

  it("maps known availability and OMITS unknown availability", () => {
    const list = productLd(buildProductSeo(input())).offers.offers;
    expect(list[0].availability).toBe("https://schema.org/InStock");
    expect(list[1].availability).toBe("https://schema.org/OutOfStock");
    expect("availability" in list[2]).toBe(false);
  });

  it("never fabricates ratings, reviews or aggregate ratings", () => {
    const text = JSON.stringify(buildProductSeo(input()).jsonLd);
    expect(text).not.toMatch(/aggregateRating|ratingValue|reviewCount|"review"|"rating"|bestRating/i);
  });

  it("omits fields that GDN does not have", () => {
    const ld = productLd(buildProductSeo(input({ brand: null, description: null, imageUrl: null })));
    expect(ld.brand).toBeUndefined();
    expect(ld.description).toBeUndefined();
    expect(ld.image).toBeUndefined();
    expect(ld.name).toBe("Acme Phone 128GB");
  });

  it("omits offers entirely when there are none", () => {
    expect(productLd(buildProductSeo(input({ offers: [] }))).offers).toBeUndefined();
  });

  it("never mixes currencies in one AggregateOffer", () => {
    const eur: SeoOffer = { ...alpha, merchantName: "Euro Store", currency: "EUR" };
    const offers = productLd(buildProductSeo(input({ offers: [alpha, eur] }))).offers;
    expect(offers.offerCount).toBe(1);
    expect(offers.priceCurrency).toBe("USD");
  });

  it("includes the category in breadcrumbs only for indexable pages", () => {
    const crumbs = (seo: ReturnType<typeof buildProductSeo>) =>
      (seo.jsonLd[1] as any).itemListElement.map((item: any) => item.name);
    expect(crumbs(buildProductSeo(input()))).toEqual(["Home", "Phones", "Acme Phone 128GB"]);
    expect(crumbs(buildProductSeo(input({ indexable: false })))).toEqual(["Home", "Acme Phone 128GB"]);
    expect(crumbs(buildProductSeo(input({ category: null })))).toEqual(["Home", "Acme Phone 128GB"]);
  });
});

describe("buildListingSeo", () => {
  const items = [
    { name: "Phone A", slug: "phone-a" },
    { name: "Phone B", slug: "phone-b" },
  ];

  it("builds a category page", () => {
    const seo = buildListingSeo({ siteUrl: SITE, kind: "category", name: "Phones", slug: "phones", marketName: "United States", items, total: 2, page: 1 });
    expect(seo.title).toBe("Phones Price Comparison | GDN");
    expect(seo.canonical).toBe(`${SITE}/category/phones`);
    expect(seo.description).toContain("Compare prices on 2 Phones products in United States.");
    const list = seo.jsonLd.find((entry) => entry["@type"] === "ItemList") as any;
    expect(list.itemListElement.map((entry: any) => entry.url)).toEqual([
      `${SITE}/product/phone-a`,
      `${SITE}/product/phone-b`,
    ]);
  });

  it("canonicalises later pages to their own URL and notes the page in the title", () => {
    const seo = buildListingSeo({ siteUrl: SITE, kind: "category", name: "Phones", slug: "phones", marketName: "United States", items, total: 50, page: 2 });
    expect(seo.canonical).toBe(`${SITE}/category/phones?page=2`);
    expect(seo.title).toContain("Page 2");
  });

  it("builds a store page with the store as an Organization and a singular noun", () => {
    const seo = buildListingSeo({ siteUrl: SITE, kind: "store", name: "Alpha Store", slug: "alpha-store", marketName: "United States", items: [items[0]!], total: 1, page: 1 });
    expect(seo.canonical).toBe(`${SITE}/store/alpha-store`);
    expect(seo.description).toContain("1 product offered by Alpha Store");
    expect(seo.jsonLd.filter((entry) => entry["@type"] === "Organization")).toHaveLength(2);
    expect(JSON.stringify(seo.jsonLd)).not.toMatch(/rating|review/i);
  });
});
