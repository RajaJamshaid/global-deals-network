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

export function getPool(): Pool {
  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in your environment " +
        "before using the database (see .env.example).",
    );
  }

  if (!pool) {
    pool = new Pool({ connectionString: env.databaseUrl });
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
