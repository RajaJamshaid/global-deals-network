Global Deals Network

Stage 1F - Production Deployment Preparation

File: "docs/implementation/GDN_Stage1F_Production_Deployment.md"
Version: 1.0
Stage: Stage 1 - Small MVP (FAST LAUNCH)
Status: Implementation Specification

---

1. Objective

Take the completed Stage 1C/1D/1E backend (Core Data/API, Amazon
Affiliate, Telegram Channel/Bot foundation) and make it safe to run
against the real Supabase production database and real Telegram/
Amazon traffic, without redesigning the architecture or migrating
frameworks.

---

2. What changed in the codebase for this stage

- src/config/database.ts: TLS is now enabled automatically for any
  non-local Postgres host (Supabase-safe pattern Supabase itself
  documents for the `pg` client), and left off for localhost/CI
  Postgres. No change for local development or CI.
- src/config/env.ts: added CORS_ALLOWED_ORIGINS, RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS. All have safe defaults - nothing breaks for
  an environment that does not set them.
- src/api/http/cors.ts, src/api/http/rate-limit.ts (new): the
  "Initial Security" minimums from
  GDN_Repository_And_Environment_Setup.md section 26 (CORS, API rate
  limiting) that were not yet implemented. Written without new npm
  dependencies, per CODE QUALITY ("avoid unnecessary dependencies").
  The Telegram webhook route is exempt from rate limiting so it keeps
  its existing "always return 200" guarantee (see
  GDN_Stage1E_Telegram_Channel_Bot_Foundation.md).
- src/api/server.ts: registers the above, and sets `trustProxy: true`
  so rate limiting keys on the real client IP behind Cloudflare
  rather than Cloudflare's edge IP.
- src/api/routes/health.ts: GET /api/v1/health now does a real
  `SELECT 1` against Postgres and reports 503/"degraded" if the
  database is unreachable, instead of always reporting "ok"
  regardless of database state.

None of the above touches the centralized Affiliate Engine, the
redirect flow, deal/offer/product data model, or any route's request/
response contract beyond the additive `database` field on the health
response.

---

3. Deployment decision

Chosen for this launch: a containerized Node process (Dockerfile at
the repo root) running the existing Fastify app unmodified, deployed
to any Node-capable container host, with Cloudflare kept in front of
`deals.tickmarktools.com` purely as DNS/proxy (TLS/CDN/WAF) - the same
role it already plays for TickmarkTools, per section 15 of the
project rules ("treat the GDN deployment as isolated from the
existing TickmarkTools website").

Considered and deferred: Cloudflare Workers + Hyperdrive. Cloudflare's
current documentation confirms the `pg` driver already used in this
repo works from a Worker via a Hyperdrive binding, which makes this a
genuinely viable, more "Cloudflare-native" option later. It was not
chosen for the initial launch because two parts of this specific
codebase would need to be adapted and test-deployed first, not just
configured:

  a) Fastify's server model (`app.listen()` on a real socket) does not
     map 1:1 to a Worker's `fetch(request)` handler. A bridge exists
     (Fastify's own `inject()`, designed to simulate a request without
     a socket) but has not been proven out in this repo.
  b) `src/config/database.ts` keeps one long-lived `pg.Pool` for the
     life of the Node process. Cloudflare's own Hyperdrive examples
     create a new `Client` per request instead and let Hyperdrive do
     the pooling - Workers' isolate lifecycle does not guarantee a
     long-lived `Pool` behaves correctly the way it does in a normal
     Node process.

See deploy/README.md for the concrete release steps for the chosen
approach. This section (3) should be revisited, not silently
replaced, if a future stage decides to spike the Workers option -
per the project's "Do Not Rebuild" rule, that would be an addition
alongside the container deployment, evaluated on its own, not an
assumed replacement for it.

---

4. Stage 1F Done Criteria

[x] CORS, rate limiting, and TLS-to-Supabase implemented
[x] /api/v1/health verifies database connectivity
[x] Deployment approach identified and documented
[x] Dockerfile + release steps written
[ ] Image built and deployed to a chosen host
[ ] Migrations run against Supabase production
[ ] Telegram webhook registered against the production URL
[ ] Amazon affiliate flag flipped to true once the tag is approved

The last four are execution steps for whoever holds deployment
credentials (Cloudflare, the container host, Supabase) - this stage's
code and documentation are ready for them.
