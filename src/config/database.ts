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

export function getPool(): Pool {
  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in your environment " +
        "before using the database (see .env.example).",
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
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
