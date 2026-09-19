import { badRequest, conflict } from "./errors.js";

interface PgLikeError {
  code?: string;
}

function isPgError(error: unknown): error is PgLikeError {
  return typeof error === "object" && error !== null && "code" in error;
}

/**
 * Translates raw PostgreSQL driver errors into safe, structured API
 * errors. Never rethrows or exposes the original error - which could
 * contain the SQL statement, column names, or constraint names - to
 * the caller, per the Stage 1C task's "Do not expose raw PostgreSQL
 * errors to API users" and
 * docs/architecture/GDN_API_Architecture.md ("Database credentials
 * and affiliate secrets must never be returned through API
 * responses").
 *
 * Postgres error codes: 23505 = unique_violation, 23503 =
 * foreign_key_violation.
 *
 * Any error that isn't one of those two known codes is returned
 * unchanged, so server.ts's generic error handler logs it fully
 * server-side and returns a safe 500 to the client.
 */
export function translateDbError(
  error: unknown,
  conflictMessage: string,
  foreignKeyMessage: string,
): unknown {
  if (isPgError(error)) {
    if (error.code === "23505") {
      return conflict(conflictMessage);
    }
    if (error.code === "23503") {
      return badRequest(foreignKeyMessage);
    }
  }
  return error;
}
