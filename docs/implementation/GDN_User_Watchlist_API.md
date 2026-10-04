# GDN User Watchlist & Price Alerts (Phase 1, Commit 6)

## Authentication (Telegram Mini App)

User-scoped routes use Telegram's documented `initData` HMAC verification
(`src/telegram/init-data.ts`):

```
Authorization: tma <initData>
```

- `initData` is the raw string from `Telegram.WebApp.initData`.
- Verified with the existing `TELEGRAM_BOT_TOKEN` (constant-time compare).
  Without a bot token configured, every credential is rejected.
- `auth_date` must be recent: `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS`
  (default 86400, range 60-604800). Future-dated data is rejected.
- The verified Telegram user is mapped onto the existing `users` /
  `user_identities` tables (provider `telegram`). No second user system.
- Sets `request.user = { userId, telegramUserId }`. initData, its hash and
  the bot token are never logged or returned (the Authorization header is
  also redacted from request logs). Credentials go in the header only,
  never the URL.
- Separate from the internal API key (`Authorization: Bearer ...`):
  neither credential works in place of the other.

## Endpoints

All three require a verified Telegram user (401 otherwise) and are scoped
to that user.

- `POST /api/v1/products/:id/watch` body `{ market_id, target_price? }` -
  creates (201) or updates (200) the caller's watch. `target_price` omitted
  keeps the existing target; `null` clears it; otherwise it must be a number
  > 0 (rounded to cents). The product must exist (404), the market must
  exist (400) and the product must have an offer in that market (400).
- `DELETE /api/v1/products/:id/watch?market_id=` - removes (deactivates)
  the caller's watch: 204, or 404 if they have none.
- `GET /api/v1/users/me/watchlist?market_id=` (`page`, `limit`,
  `include_inactive=true`) - the caller's watches with product, image,
  lowest shown price (best offer by effective price), target price, price
  status, active flag and `target_reached`.

The watch routes are exempt from the internal API key guard because they
authenticate with the user credential instead; the route plugin enforces
`requireUser` on every route it registers.

`GET /api/v1/products/:id?market_id=` stays public. For a verified user it
adds `watch: { is_watching, target_price, watch_active }` (their own watch
only). Anonymous callers, and callers with a missing, invalid or expired
credential, get the unchanged public response.

## Data model

Uses migration 014 as-is (no new migration). `user_product_watch` is unique
on `(user_id, product_id)`: a user has one watch per product, and it carries
the market it is watched in. Watching the same product in another market
moves the watch; a target in the old currency is cleared unless a new one is
given.

## Price alerts

`src/alert/price-alert.service.ts` creates `price_alert_event` rows of type
`target_price_reached` when, for an active watch with a target, the best
usable offer's effective price (existing effective-price ranking) is at or
below the target. A usable offer is in stock and not sample (fixture) data.

- Each event is tied to the exact price observation that triggered it; the
  existing unique index `(watch_id, history_id, event_type)` makes re-runs
  safe. A new lower observation raises a new event.
- Events are created `pending`, with no delivery channel and no `sent_at`.
  Nothing is sent to Telegram yet and nothing is ever marked as sent.
- Triggered after an offer is created or updated (price, currency,
  availability, status or fixture flag). Failures are logged and never fail
  the offer write.
