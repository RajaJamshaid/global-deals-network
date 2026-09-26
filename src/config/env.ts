/**
 * Central environment/config loader.
 *
 * Per docs/implementation/GDN_Repository_And_Environment_Setup.md:
 * - No secrets are hard-coded here.
 * - All values come from process.env (.env locally, platform secrets in
 *   staging/production).
 * - Future modules (market, catalog, affiliate, etc.) should read
 *   configuration through this module rather than reading process.env
 *   directly, so config stays separated from business logic.
 */
import "dotenv/config";

/**
 * Trims surrounding whitespace before treating a value as "set".
 * Dashboard env-var UIs (Render included) can silently preserve a
 * trailing newline or leading/trailing space from a copy-paste (for
 * example, pasting a full DATABASE_URL that had a trailing newline
 * in the clipboard). For a connection string that corrupts the host
 * portion enough that the driver fails before ever reaching the
 * database - producing an error with zero trace on the database
 * server's own side, since the connection attempt never gets that
 * far. Trimming removes this whole failure class without needing to
 * know what the value actually is.
 */
function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function rawEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function listEnv(name: string, fallback: string[]): string[] {
  const raw = rawEnv(name);
  if (!raw) {
    return fallback;
  }
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

const appUrl = optionalEnv("APP_URL", "http://localhost:8080");

export const env = {
  appName: optionalEnv("APP_NAME", "Global Deals Network"),
  appEnv: optionalEnv("APP_ENV", "development"),
  appUrl,
  apiVersion: optionalEnv("API_VERSION", "v1"),
  port: Number(optionalEnv("PORT", "8080")),
  host: optionalEnv("HOST", "0.0.0.0"),
  // Undefined (not a fallback string) when unset - the database layer
  // decides what to do about a missing DATABASE_URL, since not every
  // part of the app needs a database connection.
  databaseUrl: rawEnv("DATABASE_URL"),
  // Amazon Associates configuration (Stage 1D). Reuses the
  // AMAZON_AFFILIATE_TAG variable name already established in
  // .env.example since Stage 1A, rather than introducing a
  // differently-named variable for the same thing.
  // AMAZON_AFFILIATE_ENABLED defaults to false: an explicit opt-in is
  // required even if a tag is present, so a tag can be configured in
  // an environment without immediately going live.
  amazonAffiliateTag: rawEnv("AMAZON_AFFILIATE_TAG"),
  amazonAffiliateEnabled: optionalEnv("AMAZON_AFFILIATE_ENABLED", "false") === "true",
  // Telegram Bot configuration (Stage 1E). TELEGRAM_BOT_TOKEN has
  // been in .env.example since Stage 1A but was unused until now.
  // TELEGRAM_WEBHOOK_SECRET is compared against the
  // X-Telegram-Bot-Api-Secret-Token header on every webhook call -
  // undefined means the webhook route refuses all requests rather
  // than silently accepting unverified ones.
  telegramBotToken: rawEnv("TELEGRAM_BOT_TOKEN"),
  telegramWebhookSecret: rawEnv("TELEGRAM_WEBHOOK_SECRET"),
  telegramChannelId: rawEnv("TELEGRAM_CHANNEL_ID"),
  // Production hardening (FAST LAUNCH / production-readiness pass).
  // CORS_ALLOWED_ORIGINS is a comma-separated allow-list of browser
  // origins permitted to call this API cross-origin (the future
  // Telegram Mini App frontend, once web/ is built, is the expected
  // consumer). Defaults to just APP_URL - a real deployment adds the
  // Mini App's own origin here once it exists. This is configuration,
  // not a hard-coded list, per CODE QUALITY ("do not hard-code ...
  // where configuration/data can be used").
  corsAllowedOrigins: listEnv("CORS_ALLOWED_ORIGINS", [appUrl]),
  // Simple per-IP request cap (see api/http/rate-limit.ts) covering
  // docs/implementation/GDN_Repository_And_Environment_Setup.md
  // section 26's "API Rate Limiting" Stage 1 minimum. Generous
  // defaults so legitimate Mini App/bot traffic is never the
  // bottleneck; tune via env per environment without a code change.
  rateLimitMax: Number(optionalEnv("RATE_LIMIT_MAX", "300")),
  rateLimitWindowMs: Number(optionalEnv("RATE_LIMIT_WINDOW_MS", "60000")),
} as const;

export type Env = typeof env;
