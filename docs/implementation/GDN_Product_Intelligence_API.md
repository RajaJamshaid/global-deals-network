# GDN Product Intelligence API (Phase 1, Commit 5)

`GET /api/v1/products/:id?market_id=<uuid>`

Returns everything the Mini App needs for one product in one market. It
only composes existing logic: offers/merchants/deals from the comparison
service, ordering and effective price from `effective-price.ts`, price
status from `price-status.ts`, Deal Score from `deal-score.ts`.

## Input

- `:id` - product UUID (400 if malformed, 404 if unknown).
- `market_id` - market UUID (400 if malformed or repeated, 404 if unknown).
  Prices are never mixed across markets.
- Without `market_id` the endpoint returns the original plain product
  record (unchanged) so existing callers keep working. Always send
  `market_id` from the Mini App.

## Response (`data`)

All original product fields (`product_id`, `name`, `slug`, `brand`,
`description`, `image_url`, `category_id`, `status`, timestamps), plus:

- `category` - `{ category_id, name, slug }` or null
- `market` - `{ market_id, code, name, currency }`
- `offer_count`, `best_offer_id`
- `effective_price` - best offer's `{ listed_price, effective_price,
  total_discount, currency, applied_adjustments }` (equals listed price
  until a verified coupon/cashback source exists), or null
- `offers[]` - sorted by rank (in-stock first, then lowest effective
  price): `rank`, `offer_id`, `merchant`, `listed_price`, `currency`,
  `effective_price`, `total_discount`, `applied_adjustments`,
  `original_price`, `condition`, `availability_status`, `in_stock`,
  `is_fixture`, `affiliate_available`, `deal_id`, `redirect_path`,
  `updated_at`, and `shipping`/`coupon`/`cashback` (always `null`).
  The raw merchant URL is not exposed: CTAs must use `redirect_path`
  (the central Affiliate Engine redirect).
- `availability` - in-stock / out-of-stock / unknown offer counts
- `price_status` - `low | normal | high | not_enough_data`, verdict,
  average/min/max, `difference_pct`, `observation_count`, `window_days`,
  `scored_offer_id`, `message` (set when there is too little history)
- `deal_score` - `score` (0-100 or null), `rating`, `confidence`,
  `reasons[]` ("Why this score?"), `signals[]`, `scored_offer_id`
- `data_availability` - shipping, coupons, cashback, ratings, reviews and
  buyer counts are all `false`: they do not exist in the data model and
  are never estimated.

## Safeguards

- Price status and Deal Score describe the best offer against that
  merchant's own stored history in this market.
- Fixture observations are excluded by default; a fixture best offer is
  returned flagged `is_fixture` and is not scored.
- No price evidence at all gives `score: null` (`unrated`), never a
  fabricated number. No usable history caps the score; an out-of-stock
  best offer caps it lower (existing config).
