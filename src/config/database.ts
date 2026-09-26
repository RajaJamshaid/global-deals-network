import { Pool } from "pg";
import { env } from "./env.js";

/**
 * Centralized PostgreSQL connection.
 *
 * Per docs/architecture/GDN_Database_Implementation_Architecture.md
 * ("Database Role", "Connection Management") and PROJECT_STRUCTURE.md's
 * "keep database access centralized" rule: application code, migration
 * scripts, and seed scripts all obtain their connection through this
 * module rather than creating their own `pg` clients.
 *
 * The pool is created lazily on first use, not at import time, so
 * modules that don't touch the database (e.g. the health route) never
 * require DATABASE_URL to be set.
 */
let pool: Pool | null = null;

/**
 * Supabase (and effectively every managed Postgres host) requires
 * TLS. `rejectUnauthorized: false` is the connection pattern Supabase
 * itself documents for the `pg` client, since verifying the full
 * chain against Node's default CA store is not always reliable for
 * managed providers. Local/CI Postgres (localhost, used by
 * .github/workflows/ci.yml's service container) has no TLS listener
 * at all, so SSL must stay off there - this is derived from the
 * connection string's host, never hard-coded to one environment.
 */
function resolveSsl(databaseUrl: string): { rejectUnauthorized: boolean } | undefined {
  try {
    const { hostname } = new URL(databaseUrl);
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return undefined;
    }
    return { rejectUnauthorized: false };
  } catch {
    return { rejectUnauthorized: false };
  }
}

/**
 * Supabase's own connection strings (including the Session Pooler
 * one) include `?sslmode=require`. `pg`'s connection-string parser
 * reads that query param itself and derives its own `ssl: true` from
 * it - which, when both a parsed connection string AND an explicit
 * top-level `ssl` option are given to `Pool`, wins over our explicit
 * `resolveSsl()` result above. `ssl: true` means full certificate-
 * chain verification against Node's default CA store, which is
 * exactly what produces a "self-signed certificate in certificate
 * chain" (SELF_SIGNED_CERT_IN_CHAIN) error - even though this file
 * explicitly sets `rejectUnauthorized: false`. Stripping the query
 * param here removes that conflict so our own `resolveSsl()` is the
 * only thing deciding TLS behavior, as intended. Nothing else about
 * the connection string (host/port/user/password/database) changes.
 */
function stripSslModeParam(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

export function getPool(): Pool {
  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in your environment " +
        "before using the database (see .env.example).",
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString: stripSslModeParam(env.databaseUrl),
      ssl: resolveSsl(env.databaseUrl),
    });
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
