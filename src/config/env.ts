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

export const env = {
  appName: optionalEnv("APP_NAME", "Global Deals Network"),
  appEnv: optionalEnv("APP_ENV", "development"),
  appUrl: optionalEnv("APP_URL", "http://localhost:8080"),
  apiVersion: optionalEnv("API_VERSION", "v1"),
  port: Number(optionalEnv("PORT", "8080")),
  host: optionalEnv("HOST", "0.0.0.0"),
} as const;

export type Env = typeof env;
