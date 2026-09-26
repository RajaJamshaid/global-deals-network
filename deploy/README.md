# GDN Backend - Deployment

This directory holds the deployment configuration for the Stage 1
USA + Amazon MVP backend. It intentionally stays small - see
docs/implementation/GDN_Stage1F_Production_Deployment.md for the full
reasoning behind the choices here.

## Chosen approach: containerized Node process behind Cloudflare (DNS/proxy only)

The backend is a standard Node/Fastify process that talks to Postgres
over a raw TCP connection via `pg`. That runs unmodified in any
Node-capable container host. This repo's `Dockerfile` (at the repo
root) builds it as a single image:

```
docker build -t gdn-api .
docker run -p 8080:8080 --env-file .env gdn-api
```

Deploy that image to any container host (a small VPS, Fly.io,
Render, Railway, or Cloudflare's own container product, if available
on your account) and point `deals.tickmarktools.com`'s Cloudflare DNS
record at it (proxied/orange-cloud, so Cloudflare continues to sit in
front for TLS/CDN/WAF - no different from how the existing
TickmarkTools domain is presumably already fronted). No framework
migration, no rewrite of `src/config/database.ts`'s connection
pooling - the app itself is unchanged by this deployment choice.

## Required at runtime

Set every variable in `.env.example` for the target environment
(`APP_ENV=production`, the real `DATABASE_URL`, Telegram/Amazon
values, `CORS_ALLOWED_ORIGINS`, etc.) as container/platform secrets -
never bake them into the image.

## Release steps (in order)

1. `npm run db:migrate` - run once per deploy, from a machine/CI job
   with `DATABASE_URL` set to the Supabase production database. Safe
   to run repeatedly (see scripts/db-migrate.ts's `schema_migrations`
   tracking) - do not skip this even if you believe it already ran.
2. Build and deploy the container (above).
3. Confirm `GET /api/v1/health` returns `{"status":"ok", ...,
   "database":"connected"}`.
4. `npm run telegram:set-webhook -- https://deals.tickmarktools.com/api/v1/telegram/webhook`
   (one-off, only needed again if the domain changes).
5. Set `AMAZON_AFFILIATE_ENABLED=true` only once the Amazon Associates
   tag is approved and ready to go live.

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
discover for the first time during the Stage 1 launch. Revisit this
once there is time to spike it properly; the container path above
has none of this risk and is the correct choice to launch on.
