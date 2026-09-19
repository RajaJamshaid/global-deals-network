import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, getPool } from "../src/config/database.js";

/**
 * Minimal, deterministic SQL migration runner.
 *
 * No ORM/migration framework dependency - per CODE QUALITY ("avoid
 * unnecessary dependencies") and
 * docs/architecture/GDN_Database_Implementation_Architecture.md
 * ("Raw SQL may be used where performance or database-specific
 * capabilities justify it"). Applies every .sql file under
 * database/migrations/, in filename order, that isn't already
 * recorded in schema_migrations. Safe to run repeatedly: already-
 * applied migrations are skipped.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../database/migrations");

async function run(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const { rows } = await pool.query<{ name: string }>(
    "SELECT name FROM schema_migrations",
  );
  const applied = new Set(rows.map((row) => row.name));

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        file,
      ]);
      await client.query("COMMIT");
      console.log(`Applied migration: ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Migration failed: ${file}\n${String(error)}`);
    } finally {
      client.release();
    }
  }

  console.log("Migrations up to date.");
}

run()
  .then(() => closePool())
  .catch(async (error: unknown) => {
    console.error(error);
    await closePool();
    process.exitCode = 1;
  });
