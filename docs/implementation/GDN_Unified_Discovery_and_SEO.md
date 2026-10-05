# GDN Unified Discovery, Product Pages and SEO (Phase 1, Commit 7)

GDN is a platform-independent price-comparison system. Google, the website
and Telegram are only front doors; all of them use the same backend
services.

```
Google ──► /product/:slug (server-rendered) ─┐
Web search ─► /api/v1/products/search ───────┤
Telegram /search ─► searchProductsService ───┼──► canonical product_id ──► market ──►
Barcode ─► /api/v1/products/search/barcode ──┤    product intelligence (offers, effective
Image ─► /api/v1/products/search/image ──────┘    price, price status, Deal Score) ──► Shop
                                                  = /api/v1/redirect/deal/:id (affiliate)
```

## One comparison pipeline

`getProductIntelligenceService(productId, marketId)` (`GET /products/:id?market_id=`)
is the only comparison/intelligence implementation. Barcode and image
discovery resolve a canonical product id and call it through
`compareCanonicalProduct()` (`src/discovery/discovery.service.ts`); the SEO
product page renders its output. Text search lists candidates using the same
ranking, price-status and Deal Score modules, in three queries per page.

Offer ordering everywhere: in stock first, then effective price (existing
`effective-price.ts`); price status and Deal Score are the existing modules
with unchanged weights. Shipping, coupons, cashback, ratings, reviews and
buyer counts do not exist in the data and are never shown or invented.

## Endpoints

- `GET /api/v1/products/search?q=&market_id=` - comparison-oriented text
  search (market required; unknown market 404). Each result: product, image,
  brand, market, offer count, best offer (store, listed + effective price,
  currency, stock, fixture flag), price status, Deal Score (null without
  evidence), `compare_path`, `page_path`.
- `GET /api/v1/products/search/barcode?code=&market_id=` - UPC-A / EAN-8 /
  EAN-13 / GTIN-14, check digit verified, normalised to 14 digits. Returns
  `{ discovery, comparison }`. 400 invalid, 404 "Product not found for this
  barcode" (nothing is ever invented from a barcode).
- `POST /api/v1/products/search/image?market_id=` - the request body is the
  raw image (`image/jpeg|png|webp`, max 5 MB; declared type and file signature
  both checked; nothing stored; no filename is read). Requires a verified
  Telegram user. With no recognition provider configured (the case today)
  it answers `503 IMAGE_IDENTIFICATION_UNAVAILABLE`. A provider
  (`ImageIdentificationProvider`) only returns a canonical product id, which
  is re-checked and then goes through the normal pipeline.
- `GET /api/v1/products/:id?market_id=` - full product intelligence.

States: loading (client), results, no results (empty list), product not found
(404), market unavailable (404), no offers (200 with empty `offers`), invalid
barcode (400), barcode not found (404), image unavailable (503), insufficient
price history (`price_status.status = not_enough_data` + message), API error.

## Public pages (no Telegram, signup or app)

Rendered by the API (`src/seo/`) at the root, no JavaScript, strict CSP:

- `/product/:slug` - product landing page: best price, compare table, price
  intelligence, Deal Score with reasons, Shop links through the affiliate
  redirect (`rel="sponsored nofollow"`), never a raw merchant URL.
- `/category/:slug`, `/store/:slug` - only when they have real products
  (otherwise 404: no thin pages). Page size 24, `?page=`.
- `/sitemap.xml` (index), `/sitemap-products.xml`, `/sitemap-categories.xml`,
  `/sitemap-stores.xml`, `/robots.txt`.

Rules: sample (fixture) offers are never shown, counted or indexed; a
product without real offers renders but is `noindex`; only the default market
(`DEFAULT_MARKET_CODE`, US) is indexable; `?market=XX` pages are `noindex` and
canonicalise to the base URL; canonical is always `SITE_URL/product/:slug`;
an upper-case slug 301-redirects to lower case. An empty catalogue gives an
empty, valid sitemap.

Metadata is generated from real data only: title, meta description,
canonical, Open Graph and Twitter tags, and schema.org `Organization`,
`BreadcrumbList`, `Product` (+ `AggregateOffer`/`Offer`) and `ItemList`.
Fields GDN does not have are omitted. No ratings, reviews, aggregate ratings,
verified or guarantee claims.

## Configuration

- `SITE_URL` - canonical base (defaults to `APP_URL`).
- `PUBLIC_API_URL` - API base for Shop links on SEO pages. **Set it in
  production** (the API's public URL) because the pages are served from the
  website's domain.
- `DEFAULT_MARKET_CODE` - default `US`.

## Serving the pages on the website's domain

The website is a static Cloudflare Pages site and the pages are rendered by
the API. `functions/` holds small Cloudflare Pages Functions that forward only
these GET paths to the API (`functions-lib/gdn-proxy.js`; origin from the
Pages variable `GDN_API_ORIGIN`, default the Render URL). Nothing else and no
credentials are forwarded.

## Telegram

`/search` -> bot asks (force_reply) -> user replies -> `searchProductsService`
-> up to 5 results with "Compare" buttons that open the product landing page
(as a Mini App `web_app` button on https). `/search <query>` also works. The
normal Telegram search bar is not readable by bots and inline mode is not
used; the core search works without Telegram.

## Data / migration

Migration `016_create_product_barcodes.sql` adds the barcode -> product
mapping table. It is NOT applied to production by this commit and must be
applied before the barcode endpoint is used there (until then only that
endpoint fails). Nothing in this commit seeds data.
