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

function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

function rawEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  appName: optionalEnv("APP_NAME", "Global Deals Network"),
  appEnv: optionalEnv("APP_ENV", "development"),
  appUrl: optionalEnv("APP_URL", "http://localhost:8080"),
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
} as const;

export type Env = typeof env;
