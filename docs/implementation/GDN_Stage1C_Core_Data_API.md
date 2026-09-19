# GDN Stage 1C — Core Data API

Implementation note only. Does not change or override anything in
`docs/architecture/` — factual record of how Stage 1C applied
`GDN_API_Architecture.md` and the Stage 1B schema.

## Routes

All under `/api/v1/` (existing `GET /api/v1/health` unchanged).

```
GET    /markets              GET    /markets/:id
GET    /categories           GET    /categories/:id

POST   /products              GET    /products            GET /products/:id
PATCH  /products/:id          DELETE /products/:id

POST   /merchants              GET   /merchants            GET /merchants/:id
PATCH  /merchants/:id          DELETE /merchants/:id

POST   /offers                 GET   /offers               GET /offers/:id
PATCH  /offers/:id             DELETE /offers/:id

POST   /deals                  GET   /deals                GET /deals/:id
PATCH  /deals/:id              DELETE /deals/:id
```

Markets and categories are read-only, per the task's "do not create
unnecessary public mutation endpoints" for foundational reference
data.

List endpoints support `?page=&limit=` (default 20, max 100) and a
few schema-backed filters: `products` (`category_id`, `status`),
`merchants` (`status`), `offers` (`product_id`, `merchant_id`,
`market_id`, `status`), `deals` (`market_id`, `category_id`,
`merchant_id`, `status`).

## Response format

Per `docs/architecture/GDN_API_Architecture.md` §23–24 (used as-is,
not the task prompt's alternate example — the architecture doc is the
source of truth where the two differ):

```json
// single resource
{ "success": true, "data": { ... } }

// list
{ "success": true, "data": [ ... ], "meta": { "page": 1, "limit": 20, "total": 42 } }

// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

Error codes used: `VALIDATION_ERROR` (400), `RESOURCE_NOT_FOUND`
(404), `CONFLICT` (409), `INTERNAL_ERROR` (500, generic — no SQL,
stack trace, or credential ever reaches the response body; the full
error is logged server-side via Fastify's logger only).

## Data layer

`Route → Service → Repository → Pool` (`src/config/database.ts`),
per the task's layering guidance, applied only where there's real
validation/business logic to separate out:

- **markets / categories**: repository + routes only — plain reads,
  no service layer needed.
- **products / merchants / offers / deals**: repository (raw
  parameterized SQL) + service (manual field validation, foreign-key
  existence checks via `src/api/http/exists.ts`, PostgreSQL error
  translation via `src/api/http/db-errors.ts`) + routes (thin HTTP
  glue).

No new npm dependency was added for validation — manual checks in
`src/api/http/validation.ts` (string/number/boolean/enum/UUID/date),
matching the existing "avoid unnecessary dependencies" rule and
avoiding another lockfile-regeneration round.

## Two schema-driven decisions worth flagging

**DELETE = deactivate, never a physical row delete.** `offers` has
`ON DELETE CASCADE` from `products`/`merchants`; a hard `DELETE` on a
product would silently wipe every offer for it. Every table already
has a status/lifecycle field for exactly this, so `DELETE` endpoints
set: `products.status='inactive'`, `merchants.merchant_status=
'inactive'`, `offers.status='removed'`,
`deals.deal_status='archived'` — and return `204`. `GET` after
deletion still returns the row (with the updated status), which is
what "deactivate" means as opposed to "remove."

**`product_id`/`merchant_id`/`market_id` (offers) and
`merchant_id`/`market_id` (deals) are not updatable via `PATCH`.**
They define the offer's unique identity (or, for deals, the
required-at-creation scope); changing them is treated as creating a
new record rather than mutating an existing one.

## Tests

`tests/api/{markets,categories,products,merchants,offers,deals}.test.ts`
— real Fastify + real PostgreSQL via `app.inject()`, no mocking,
following the same convention `tests/integration/database.test.ts`
already established: `describe.skipIf(!process.env.DATABASE_URL)` so
`npm test` still passes without a database configured locally, and
CI (which always sets `DATABASE_URL`) genuinely executes every one of
them — nothing silently skips there.

Covers, per the task's minimum list: markets/categories list + get +
missing; products create/list/get/update/delete/validation-failure/
missing/bad-FK; merchants create/list/get/update/delete/validation-
failure/duplicate-slug; offers create/list/get/update/delete/
duplicate-conflict/bad-FK; deals create/list/get/update/delete/
bad-FK/out-of-range-discount.

## What Stage 1C deliberately does not include

No auth/authorization (none of the roles in
`GDN_API_Architecture.md` §21 are implemented yet — every endpoint is
currently open, matching "service-to-service"/internal use for this
stage). No Amazon API integration, no affiliate link generation, no
search/ranking, no rate limiting/caching, no Telegram. Those are
later stages per `docs/implementation/GDN_Implementation_Master_Roadmap.md`.
