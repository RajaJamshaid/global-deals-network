import { getPool } from "../config/database.js";

export interface UserRow {
  user_id: string;
  email: string | null;
  phone: string | null;
  preferred_market_id: string | null;
  language: string | null;
  currency: string | null;
  timezone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  last_active_at: string | null;
}

export interface UserIdentityRow {
  identity_id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  username: string | null;
  created_at: string;
  last_used_at: string;
}

export async function findIdentity(
  provider: string,
  providerUserId: string,
): Promise<UserIdentityRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<UserIdentityRow>(
    "SELECT * FROM user_identities WHERE provider = $1 AND provider_user_id = $2",
    [provider, providerUserId],
  );
  return rows[0] ?? null;
}

export async function getUserById(userId: string): Promise<UserRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>(
    "SELECT * FROM users WHERE user_id = $1",
    [userId],
  );
  return rows[0] ?? null;
}

export async function createUser(input: { language?: string }): Promise<UserRow> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>(
    "INSERT INTO users (language) VALUES ($1) RETURNING *",
    [input.language ?? null],
  );
  return rows[0];
}

export interface CreateIdentityInput {
  userId: string;
  provider: string;
  providerUserId: string;
  username?: string;
}

export async function createIdentity(
  input: CreateIdentityInput,
): Promise<UserIdentityRow> {
  const pool = getPool();
  const { rows } = await pool.query<UserIdentityRow>(
    `INSERT INTO user_identities (user_id, provider, provider_user_id, username)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.userId, input.provider, input.providerUserId, input.username ?? null],
  );
  return rows[0];
}

export async function touchIdentity(identityId: string, username?: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE user_identities
     SET last_used_at = now(), username = COALESCE($2, username)
     WHERE identity_id = $1`,
    [identityId, username ?? null],
  );
}

export async function touchUserActivity(userId: string): Promise<void> {
  const pool = getPool();
  await pool.query("UPDATE users SET last_active_at = now() WHERE user_id = $1", [userId]);
}

export async function setPreferredMarket(
  userId: string,
  marketId: string,
): Promise<UserRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>(
    "UPDATE users SET preferred_market_id = $2 WHERE user_id = $1 RETURNING *",
    [userId, marketId],
  );
  return rows[0] ?? null;
}
