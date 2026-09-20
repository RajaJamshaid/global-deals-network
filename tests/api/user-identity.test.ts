import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../../src/config/database.js";
import {
  ensureUserForIdentity,
  setUserPreferredMarketService,
} from "../../src/user/user-identity.service.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("User identity service (provider-agnostic)", () => {
  afterAll(async () => {
    await closePool();
  });

  it("creates a new user and identity on first contact", async () => {
    const providerUserId = randomUUID();
    const { user, isNewUser } = await ensureUserForIdentity("telegram", providerUserId, "someuser");
    expect(isNewUser).toBe(true);
    expect(user.status).toBe("active");
  });

  it("reuses the same user on a second contact from the same identity", async () => {
    const providerUserId = randomUUID();
    const first = await ensureUserForIdentity("telegram", providerUserId);
    const second = await ensureUserForIdentity("telegram", providerUserId);

    expect(second.isNewUser).toBe(false);
    expect(second.user.user_id).toBe(first.user.user_id);
  });

  it("is provider-agnostic - the same provider_user_id under a different provider is a distinct user", async () => {
    const sharedId = randomUUID();
    const telegramUser = await ensureUserForIdentity("telegram", sharedId);
    const webUser = await ensureUserForIdentity("web", sharedId);

    expect(webUser.user.user_id).not.toBe(telegramUser.user.user_id);
  });

  it("sets a user's preferred market", async () => {
    const { user } = await ensureUserForIdentity("telegram", randomUUID());
    const pool = getPool();
    const { rows } = await pool.query("SELECT market_id FROM markets WHERE code = 'US'");
    const marketId = rows[0].market_id as string;

    const updated = await setUserPreferredMarketService(user.user_id, marketId);
    expect(updated.preferred_market_id).toBe(marketId);
  });

  it("rejects setting a non-existent market", async () => {
    const { user } = await ensureUserForIdentity("telegram", randomUUID());
    await expect(
      setUserPreferredMarketService(user.user_id, "00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow();
  });
});
