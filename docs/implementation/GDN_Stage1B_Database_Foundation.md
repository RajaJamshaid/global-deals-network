# GDN Stage 1B — Database Foundation

Implementation note only. Does not change or override anything in
`docs/architecture/` — it documents how Stage 1B applied that
architecture as a minimal first slice.

## Technology

PostgreSQL, per `docs/architecture/GDN_Database_Implementation_Architecture.md`
("Recommended Primary Database"). Accessed via the official `pg`
client (no ORM), through a single centralized pool in
`src/config/database.ts`.

## Migrations

Plain, numbered, versioned SQL files under `database/migrations/`,
applied in order by `scripts/db-migrate.ts` (`npm run db:migrate`).
A `schema_migrations` table tracks what has already run, so the
script is safe to re-run. No migration framework/ORM dependency was
added — this matches
`GDN_Database_Implementation_Architecture.md` section 258
("Raw SQL may be used where performance or database-specific
capabilities justify it") and keeps Stage 1 dependencies minimal.

## Seeds

`database/seeds/001_usa_amazon.sql`, applied by `scripts/db-seed.ts`
(`npm run db:seed`). Idempotent (`ON CONFLICT DO NOTHING`), safe to
re-run. Seeds only the USA market, the Amazon merchant, a 5-item
starter category set, and an Amazon Associates `affiliate_programs`
placeholder row (`status = 'pending'`, `commission_value = NULL`) —
no credentials, API keys, or affiliate tags are stored in the
database; those stay in environment variables
(`AMAZON_AFFILIATE_TAG`, `AMAZON_API_KEY`, `AMAZON_API_SECRET`) for a
later stage's link-generation logic to read.

## Tables (Stage 1B scope only)

`markets`, `categories`, `products`, `merchants`, `offers`, `deals`,
`affiliate_programs`, `affiliate_links`, `click_events`.

One deliberate refinement worth noting: `products` has no
`merchant_id` — it's merchant-independent, and a merchant's specific
listing of a product lives in `offers` instead (`offer_id` →
`product_id` + `merchant_id` + `market_id`, unique per combination).
This follows the more detailed offer-based model already present in
`GDN_Database_Implementation_Architecture.md` ("Canonical Product:
One canonical product may have many merchant offers"), rather than
the simpler merchant-owned-product sketch in `GDN_Data_Architecture.md`.
Both documents already describe this same direction; Stage 1B just
picks the more granular one so the schema doesn't need reshaping when
multi-merchant offers matter (Stage 1D+).

All primary keys are UUIDs (`gen_random_uuid()`, via the `pgcrypto`
extension enabled in migration 001). All tables have `created_at`;
all except `click_events` (an append-only event log) also have
`updated_at`, kept current by a shared trigger rather than relying on
application code.

`affiliate_networks` was intentionally not created as a separate
table yet — `affiliate_programs.network_name` covers it for Stage 1's
single network (Amazon Associates). Splitting it out later is a
non-breaking addition.

## Tests

`tests/integration/database.test.ts` runs real queries against a real
PostgreSQL database via `DATABASE_URL` — seed-data checks, a
multi-merchant-offer relationship check, a unique-constraint
violation check, and a foreign-key violation check. The whole suite
is skipped (not faked) when `DATABASE_URL` isn't set, so `npm test`
still passes in environments without a database configured; CI is
expected to provide a real PostgreSQL service so these actually run
there.

## CI

`.github/workflows/ci.yml` needs a `postgres` service and a test
`DATABASE_URL` added so the integration tests above actually execute
in CI, then `npm run db:migrate` before `npm test`. See the PR/commit
that introduced this note for the exact workflow content, since this
repository's connected automation could not write to
`.github/workflows/` directly (separate GitHub permission scope) and
it had to be added manually.

## What Stage 1B deliberately does not include

No API routes for these tables, no Amazon API integration, no
affiliate link generation logic, no search, no `users`/`rewards`/
`payments`/etc. tables. Those are later stages per
`docs/implementation/GDN_Implementation_Master_Roadmap.md`.
