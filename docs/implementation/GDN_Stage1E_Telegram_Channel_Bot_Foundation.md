# GDN Stage 1E — Telegram Channel + Bot Foundation

Implementation note only. Does not change or override anything in
`docs/architecture/` — factual record of how Stage 1E applied the
existing Telegram and User & Preference architecture. No existing
table was altered; two new tables were added (see "Database").

## What was implemented

- `users` + `user_identities` — the minimal, channel-agnostic slice
  of the centralized User & Preference Engine (migrations 011, 012)
- A provider-agnostic user identity service (`src/user/`), with a
  thin Telegram-specific adapter (`src/telegram/telegram-user.service.ts`)
- A minimal Telegram Bot API client (`sendMessage`, `answerCallbackQuery`,
  `setWebhook`) using Node 20's built-in `fetch` — no bot-framework
  dependency added
- `POST /api/v1/telegram/webhook` — signed via Telegram's
  `X-Telegram-Bot-Api-Secret-Token` header
- An update router dispatching to five commands: `/start`, `/help`,
  `/markets`, `/categories`, `/deals`
- Two manual/operational scripts: `telegram:set-webhook`,
  `telegram:post-deal` (Channel posting — not a public API yet)

## Why `src/user/`, not `src/telegram/`

The repository and service for `users`/`user_identities`
(`src/user/user-identity.repository.ts`, `.service.ts`) deliberately
live outside `src/telegram/`. The task requirement was explicit:
"Keep it compatible with the future Web/Mini App/WhatsApp User &
Preference Engine" and "Do NOT build a Telegram-only user database."
The tables were already channel-agnostic; putting the *code* that
reads/writes them inside a Telegram-specific folder would have
undermined that the first time a Web login or WhatsApp integration
needed the same logic. `src/telegram/telegram-user.service.ts` is the
only Telegram-aware piece — a five-line adapter that calls the
generic `ensureUserForIdentity(provider, providerUserId, username)`
with `provider = 'telegram'`. A future WhatsApp integration adds its
own equally-thin adapter calling the exact same generic function.

## Database

```sql
users (user_id, email, phone, preferred_market_id -> markets,
       language, currency, timezone, status, created_at, updated_at,
       last_active_at)

user_identities (identity_id, user_id -> users, provider,
                 provider_user_id, username, created_at, last_used_at,
                 UNIQUE(provider, provider_user_id))
```

Only one concrete preference (`preferred_market_id`) was added to
`users`. The fuller generic `user_preferences`/`user_favorites`/
wishlist system described in
`docs/architecture/GDN_User_Preference_Architecture.md` is bigger,
cross-channel future scope (ties into Web login, email, notification
preferences, the Mini App) and was not built now — this table does
not block adding it later; a generic `user_preferences` table would
sit alongside `users`, not replace it.

## Webhook flow

```
Telegram -> POST /api/v1/telegram/webhook
         -> verify X-Telegram-Bot-Api-Secret-Token === TELEGRAM_WEBHOOK_SECRET
         -> routeUpdate(update)
              -> parse update.message.text for a "/command"
              -> dispatch to the matching command handler
              -> handler calls existing repositories/services directly
                 (market.repository, category.repository, deal.repository,
                  user/user-identity.service) - no duplicated business logic
         -> always return 200 (errors logged server-side, never surfaced
            to Telegram, to avoid retry storms)
```

If `TELEGRAM_WEBHOOK_SECRET` isn't configured, every request gets
`503` — the route refuses to process anything rather than accepting
unverified calls with no secret to check against.

## Commands

| Command | Behavior |
|---|---|
| `/start [payload]` | Finds/creates the user via `ensureUserForTelegram`; welcome message varies slightly if the deep-link payload is `channel` |
| `/help` | Static command list; explicitly notes `/search` is coming soon |
| `/markets` | Lists markets (existing `market.repository.listMarkets`); `/markets <CODE>` sets `preferred_market_id` |
| `/categories` | Lists categories (existing `category.repository.listCategories`) |
| `/deals` | Active deals for the user's preferred market (default `US`), via existing `deal.repository.listDeals` — identical data source the REST API and any future channel use |

Every command is a thin translation layer: parse Telegram input ->
call an existing repository/service -> format a text reply. No deal,
product, merchant, offer, or affiliate data is duplicated or
re-fetched through a separate path — the Bot reads the same
centralized system the REST API does.

## `/search` — reserved, not implemented

Per the task's explicit instruction: `/search` stays in the
BotFather command menu, but is **not** wired to any handler here —
it's simply absent from `update-router.ts`'s command table, so a
user sending `/search` gets the generic "I don't recognize that
command yet" fallback. It will be implemented once GDN's Search
Infrastructure exists.

## Onboarding / deep-link foundation

Per the task's required future UX — Channel post -> "Get Personal
Deal Alerts" button -> Bot deep link -> registration -> alerts
enabled — the **receiving end** of that flow is built:
`https://t.me/<BotUsername>?start=channel` opens a chat with the bot
pre-filled with `/start channel`; Telegram delivers this as a normal
`/start` command with `channel` as its argument, which `start.command.ts`
reads and reflects in its welcome message.

**Not built yet** (explicitly deferred, per the task: "the exact
production onboarding/button implementation can be completed after
the basic Bot webhook is working"):
- The actual Channel post with an inline URL button pointing at that
  deep link
- Any attribution/analytics tying a `/start channel` back to a
  specific Channel post (would naturally use `click_events`'
  existing `channel`/`campaign_id` columns once built)
- Persisting the onboarding source anywhere — today it only affects
  which welcome sentence is shown

Importantly, the bot **never** assumes joining the Channel grants DM
permission — Telegram doesn't allow that, and nothing in this
implementation relies on it. A user must explicitly start a chat with
the bot (via the deep link or manually) before any message can be
sent to them, which is exactly Telegram's own constraint being
respected here, not a bypass.

## Security

- Webhook requires a matching `X-Telegram-Bot-Api-Secret-Token`
  header on every request; missing config -> `503`, wrong token ->
  `401`
- No Telegram bot token, webhook secret, or channel id is ever
  returned in an API response
- All new queries parameterized — no string-built SQL from Telegram
  input
- `telegram:post-deal` (Channel posting) is a manual script, not a
  public route — no admin auth system exists yet to gate a public one
  safely (see `docs/architecture/GDN_Identity_Authentication_Architecture.md`,
  not implemented)
- Errors inside command handling are caught and logged server-side
  only; the webhook always returns `200` regardless, so a bug in one
  command can't be discovered by an external caller via response
  content, and can't trigger Telegram retry storms

## Environment variables

```
TELEGRAM_BOT_TOKEN=        # existing since Stage 1A, now actually used
TELEGRAM_WEBHOOK_SECRET=   # new - required for the webhook to accept anything
TELEGRAM_CHANNEL_ID=       # new - used only by the manual telegram:post-deal script
```

All empty in `.env.example`. CI sets a clearly-fixture
`TELEGRAM_WEBHOOK_SECRET` value only to exercise the signed-request
test paths — not a working Telegram secret.

## What Stage 1E deliberately does not include

Telegram Mini App, WhatsApp, `/search` implementation, inline
keyboards/callback-query handling (the client accepts
`answerCallbackQuery` but no command currently sends buttons),
notification/alert delivery (no scheduler or push trigger exists),
the generic `user_preferences` table, admin authentication for
Channel posting, and any analytics/attribution wiring for the
deep-link source beyond the welcome-message branch. All per the
task's explicit scope and the general Stage 1 -> 1E roadmap.
