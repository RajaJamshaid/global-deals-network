import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, getPool } from "../src/config/database.js";

/**
 * Runs every .sql file under database/seeds/, in filename order.
 *
 * Unlike migrations, seed files are not tracked in schema_migrations -
 * each one is written to be idempotent on its own (ON CONFLICT DO
 * NOTHING against a real unique constraint), per
 * docs/architecture/GDN_Database_Implementation_Architecture.md
 * ("Production Seeds: Production seed operations must be idempotent"),
 * so re-running this script is always safe.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedsDir = path.resolve(__dirname, "../database/seeds");

async function run(): Promise<void> {
  const pool = getPool();

  const files = (await readdir(seedsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = await readFile(path.join(seedsDir, file), "utf8");
    await pool.query(sql);
    console.log(`Applied seed: ${file}`);
  }

  console.log("Seed data up to date.");
}

run()
  .then(() => closePool())
  .catch(async (error: unknown) => {
    console.error(error);
    await closePool();
    process.exitCode = 1;
  });
