# GDN Internal API Security (Phase 1)

## What is protected

Every request under `/api/v1` whose method is **not** `GET`, `HEAD` or
`OPTIONS` (that is `POST`, `PATCH`, `PUT`, `DELETE`, and anything else)
must send:

```
Authorization: Bearer <GDN_INTERNAL_API_KEY>
```

Currently this covers the write routes of products, merchants, offers,
deals and affiliate-links. The guard is **deny-by-default**: a new write
route is protected automatically.

## What is not protected

- Public reads: `GET`, `HEAD`, `OPTIONS` (catalog, search, price history,
  comparison, health, the affiliate redirect).
- `POST /api/v1/telegram/webhook`, which keeps its own
  `TELEGRAM_WEBHOOK_SECRET` authentication (constant-time comparison).
- Future user-facing endpoints (for example the watchlist) are NOT
  covered by this key. When built they must be added to the guard's
  exempt list together with real user authentication (Telegram Mini App
  `initData` verification).

## Behaviour

- Missing, malformed or wrong credential: `401`, standard error body
  `{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Unauthorized" } }`.
- **Fail closed:** if `GDN_INTERNAL_API_KEY` is unset, or shorter than 32
  characters, every protected write returns `401`. A startup warning says
  so (the key itself is never logged).
- The key is compared in constant time, never logged (`Authorization` is
  also redacted from request logs) and never returned in a response.
- The key is not added to CORS configuration; it is for server-to-server
  and admin tooling only. Never put it in browser or Mini App code.

## Setup

1. Generate a key: `openssl rand -hex 32`.
2. Set `GDN_INTERNAL_API_KEY` as a secret in the deployment platform
   (Render) and in your private local `.env`. Never commit it.
3. Tests use a fixture key from `tests/setup-env.ts`; CI may also set a
   fixture `GDN_INTERNAL_API_KEY` in its workflow environment.
4. Rotate by setting a new value and restarting; there is a single key.

## Example

```
curl -X PATCH "$API/api/v1/offers/$OFFER_ID" \
  -H "Authorization: Bearer $GDN_INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"price": 799}'
```
