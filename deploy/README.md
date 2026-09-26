# GDN Backend - Deployment

This directory holds the deployment configuration for the Stage 1
USA + Amazon MVP backend. It intentionally stays small - see
docs/implementation/GDN_Stage1F_Production_Deployment.md for the full
reasoning behind the choices here.

## Chosen approach: containerized Node process behind Cloudflare (DNS/proxy only)

The backend is a standard Node/Fastify process that talks to Postgres
over a raw TCP connection via `pg`. That runs unmodified in any
Node-capable container host. This repo's `Dockerfile` (at the repo
root) builds it as a single image and the compiled entrypoint it runs
is exactly what `npm run build` / `npm start` already produce
(`dist/index.js`, per tsconfig.build.json) - no separate deployment
logic to keep in sync.

Deploy that image to any container host (a small VPS, Fly.io,
Render, Railway, or Cloudflare's own container product, if available
on your account) and point `deals.tickmarktools.com`'s Cloudflare DNS
record at it (proxied/orange-cloud, so Cloudflare continues to sit in
front for TLS/CDN/WAF - no different from how the existing
TickmarkTools domain is presumably already fronted). Cloudflare only
needs to proxy the domain to the host's IP/port; no application
change is required for that. No framework migration, no rewrite of
`src/config/database.ts`'s connection pooling - the app itself is
unchanged by this deployment choice.

## Required production environment variables

Set these as container/platform secrets - never in the Dockerfile, in
code, or committed to the repo. Full list with comments is in
`.env.example`; these are the ones that matter for going live:

- `DATABASE_URL` - Supabase production connection string
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `AMAZON_AFFILIATE_TAG`
- `AMAZON_AFFILIATE_ENABLED` - keep `false` until the last release step below
- `APP_URL` - the public production URL (`https://deals.tickmarktools.com`)
- `APP_ENV` - `production`
- `CORS_ALLOWED_ORIGINS` - add the Mini App frontend's origin once it is built; defaults to `APP_URL` if unset

## Exact production deployment sequence

1. Build the Docker image: `docker build -t gdn-api .`
2. Run the container with production env vars (`--env-file` or your
   platform's secret manager) - this is what connects it to Supabase
   via `DATABASE_URL`: `docker run -p 8080:8080 --env-file .env.production gdn-api`
3. Run migrations against that same `DATABASE_URL`:
   `npm run db:migrate` - safe to run repeatedly (see
   scripts/db-migrate.ts's `schema_migrations` tracking), do not skip
   this even if you believe it already ran.
4. Verify `GET https://deals.tickmarktools.com/api/v1/health`.
5. Confirm the response body shows `"database":"connected"` (not
   `"not_configured"` or `"unavailable"`) - if it doesn't, stop here
   and fix the database connection before continuing.
6. Configure the Telegram webhook:
   `npm run telegram:set-webhook -- https://deals.tickmarktools.com/api/v1/telegram/webhook`
7. Only once the above are all confirmed, set
   `AMAZON_AFFILIATE_ENABLED=true` to enable live Amazon affiliate
   links.

## Alternative considered: Cloudflare Workers + Hyperdrive

Cloudflare's own docs confirm `pg` (the driver already used here)
works from a Worker via Hyperdrive's connection pooling under the
`nodejs_compat` flag. That is the more "Cloudflare-native" option and
is worth revisiting later, but it was **not** chosen for the initial
launch because it is not risk-free for this codebase specifically:

- Fastify is built around `app.listen()` on a real socket, not a
  `fetch(request)` handler - reaching Workers would need a thin
  bridge (e.g. Fastify's own `inject()`, which simulates a request
  without a socket) that has not been tested in this repo.
- `src/config/database.ts` keeps one long-lived `pg.Pool` for the
  life of the process. Cloudflare's own Hyperdrive examples create a
  new lightweight `Client` per request instead, relying on Hyperdrive
  itself for pooling - Workers' isolate lifecycle does not guarantee
  a `Pool` survives or behaves correctly between requests the way it
  does in a normal long-running Node process.

Neither of these is a large rewrite, but both need an actual test
deploy to validate before depending on them - not something to
discover for the first time during the Stage 1 launch. This stage
deliberately keeps the existing Node/Fastify architecture unchanged;
revisit Workers once there is time to spike it properly.
