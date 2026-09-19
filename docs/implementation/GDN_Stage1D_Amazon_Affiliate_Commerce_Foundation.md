# GDN Stage 1D — USA Multi-Store Commerce & Amazon Affiliate Foundation

Implementation note only. Does not change or override anything in
`docs/architecture/` — factual record of how Stage 1D applied the
existing affiliate/data/API architecture. No database schema changes
were made (see "Schema" below for why none were needed).

## What was implemented

- Amazon Associates as the first `AffiliateProvider` adapter behind a
  merchant-agnostic interface
- Centralized affiliate-link generation (`generateAffiliateLinkForOffer`),
  reused for any offer/merchant/program combination
- `POST /api/v1/affiliate-links`, `GET /api/v1/affiliate-links/:id`
- `GET /api/v1/redirect/deal/:dealId` — click tracking + safe redirect
  (affiliate URL if available, merchant URL fallback otherwise)
- `GET /api/v1/products/:id/comparison?market_id=` — price comparison
  across active offers, market-scoped
- `AMAZON_AFFILIATE_ENABLED` config flag added alongside the existing
  `AMAZON_AFFILIATE_TAG`
- `offer_url` now validated as a real http(s) URL (was previously any
  non-empty string) — closes a gap the redirect endpoint's security
  requirements exposed

## AMAZON

**Live**: nothing. This project has no official Amazon Product
Advertising API access yet, so no live Amazon data is fetched,
scraped, or invented anywhere.

**Fixture-only**: any product/offer data used in tests is created
through the normal `POST /api/v1/products` and `POST /api/v1/offers`
endpoints with clearly synthetic values (`https://example.com/...`
URLs, random slugs) — never presented as real Amazon data, never
seeded into the production dataset.

**Configuration-ready, not live by default**: the Amazon Associates
*link format* (`?tag=your-tag`) is public, documented, and requires
no API access, so `amazon.provider.ts` can build real affiliate URLs
once a real `AMAZON_AFFILIATE_TAG` is set and
`AMAZON_AFFILIATE_ENABLED=true` — both empty/false by default. CI uses
an explicit fixture value (`gdn-ci-fixture-20`) only to exercise this
code path in tests; that value is not a working Amazon tag.

**Waiting for later**: conversion/commission/revenue reporting.
Amazon Associates does not expose real-time conversion data through
the public link format — that requires the official Associates
reporting API/feed, which isn't integrated. No conversion or revenue
table or logic was added. When that access exists, the natural next
piece is a `conversions` record keyed by `click_events.click_id`,
populated by an authorized import job — not built now, and nothing
fabricates a conversion or revenue number in the meantime.

## MULTI-STORE

Nothing in this stage branches on `merchant === "Amazon"` or any
merchant name. The entire flow — offer creation, affiliate
availability, link generation, redirect, comparison — operates purely
through `merchants`, `affiliate_programs.network_name`, and the
`AffiliateProvider` interface. Adding Walmart, eBay, etc. later means:

1. A new `merchants` row (already supported, generic CRUD from Stage 1C)
2. A new `affiliate_programs` row with a new `network_name`
3. A new `providers/<network>.provider.ts` implementing `AffiliateProvider`
4. One line in `providers/registry.ts` mapping the network name to it

No route, service, or table changes required. `affiliate-link.service.ts`
and `redirect.service.ts` never change for a new merchant.

## PRICE COMPARISON

`GET /api/v1/products/:id/comparison?market_id=<uuid>` returns the
product, every active offer for it in that market (with its
merchant, any matching active deal, and `affiliate_available`), and a
`comparison` block with `lowest_price` (amount/currency/offer_id) and
`offer_count`. `market_id` is required specifically so results are
never mixed across markets/currencies (tested explicitly — see
`tests/api/comparison.test.ts`'s market isolation case).

This is a plain `min()` over each offer's `price` — no shipping/tax
modeling, no ranking algorithm, no "best deal" scoring. It identifies
the lowest *listed* price among available offers, nothing more.
Known simplification: offers within one market are assumed to share
a currency in practice; nothing in the schema enforces that at the
database level, and this stage does not attempt currency conversion.

## AFFILIATE

`generateAffiliateLinkForOffer(offerId)`:
1. Loads the offer's merchant's `affiliate_programs` row
2. Requires `status = 'active'` (the seeded Amazon row from Stage 1B
   is `'pending'` — intentionally, since there's no real approved
   program yet; it will not generate real links until updated)
3. Looks up the matching `AffiliateProvider` by `network_name`
4. Requires the provider to report itself configured
5. Reuses an existing `affiliate_links` row for the same
   program+destination if one exists, otherwise creates one

Affiliate availability is reported (`affiliate_available` on offers
in the comparison response, and via `checkAffiliateAvailability`) as
a read-only check with no side effects — checking it never creates a
link, and a product/offer is returned by every API regardless of the
result, per the task's "affiliate availability must not determine
whether a product is visible."

**Known limitation**: `affiliate_links` has no database-level unique
constraint on `(affiliate_program_id, destination_url)`; the
reuse/idempotency check in `findAffiliateLinkByDestination` is
application-level, not atomic under concurrent requests. Not adding a
migration for this in Stage 1D per the task's instruction to only
change the schema when genuinely required — flagging it here instead
as a candidate for a future migration once affiliate-link volume
makes the race condition a real concern.

## TRACKING

`GET /api/v1/redirect/deal/:dealId` records one `click_events` row
per redirect, using only existing schema columns (no new tracking
fields invented): `affiliate_link_id` (null if no affiliate link was
used), `deal_id`, `product_id`, `merchant_id`, `market_id`,
`session_id`/`channel`/`campaign_id`/`placement` (from query params,
each optional), `device_type` (User-Agent header), `referrer`
(Referer header). The write happens before the redirect response is
sent; if it fails for any reason, the redirect still proceeds
(tracking failure never blocks the user).

**Redirect security**: the only user-controlled input to this
endpoint is `dealId` (a UUID, validated, used purely as a lookup
key). The `Location` header value always comes from data already
stored in our own database (`offers.offer_url`, or an `affiliate_url`
this same request generated from it) — never from a query parameter,
header, or request body. There is no code path by which a caller can
control the redirect destination, so this cannot be used as an open
redirect / phishing vector.

## Schema

No migrations were added. Every Stage 1D need was met by the existing
Stage 1B tables (`affiliate_programs`, `affiliate_links`,
`click_events`, `offers`) plus one small, non-breaking repository-level
addition: an optional `productId` filter on `listDeals` (used
internally by the comparison service to find a matching deal; not
exposed as a new public query parameter).

## Environment variables

```
AMAZON_AFFILIATE_TAG=        # existing since Stage 1A - the Associates tag
AMAZON_AFFILIATE_ENABLED=false  # new - explicit go-live switch
```

Both stay empty/false in `.env.example`. No real credentials were
added anywhere. CI sets a clearly-fixture value only to test the
"configured" code path (see `.github/workflows/ci.yml`'s `env:` block).

## Security

- Every new UUID input validated (`requireUuidParam`/`requireUuid`)
- `offer_url`/destination URLs validated as real http(s) URLs
  (`requireUrl`/`optionalUrl`), closing a Stage 1C gap
- All new queries parameterized — no string-built SQL from user input
- No credentials returned by any API response (affiliate config is
  read server-side only, never serialized into a response body)
- Redirect endpoint has no open-redirect surface (see "Tracking" above)
- Errors funnel through the existing centralized `ApiError`/error
  handler — no new error-formatting logic, no raw DB errors exposed

## Future merchant integration process

1. Insert a `merchants` row for the new store
2. Insert an `affiliate_programs` row referencing it with a new
   `network_name`
3. Implement `providers/<network>.provider.ts`
4. Register it in `providers/registry.ts`
5. Everything else (offers, deals, comparison, redirect, tracking)
   already works for it

## Future country expansion process

1. Insert a new `markets` row
2. Repeat the merchant process above for that market's stores
3. Every existing endpoint already accepts `market_id` as a parameter
   or filter — no route/service changes needed

## Intentionally deferred

Amazon Product Advertising API integration, real conversion/commission/
revenue tracking, Walmart/eBay/Target/etc. adapters, UK/Canada/Germany/
etc. markets, Telegram (Bot/Mini App/Channel), pSEO, seller
marketplace, Telegram Stars, AI recommendation/ranking, large-scale
catalog ingestion, advanced analytics dashboards. All per the Stage 1D
task's explicit "do not implement yet" list.
