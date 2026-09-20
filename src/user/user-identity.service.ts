import { badRequest } from "../api/http/errors.js";
import { recordExists } from "../api/http/exists.js";
import {
  createIdentity,
  createUser,
  findIdentity,
  getUserById,
  setPreferredMarket,
  touchIdentity,
  touchUserActivity,
  type UserRow,
} from "./user-identity.repository.js";

export interface EnsureUserResult {
  user: UserRow;
  isNewUser: boolean;
}

/**
 * Finds or creates the GDN user for an external identity (a Telegram
 * chat today; the same function works unchanged for a future
 * 'whatsapp' or 'web' provider), per
 * docs/architecture/GDN_User_Preference_Architecture.md section 4 -
 * the provider's own user id is never treated as the GDN identity
 * itself, only mapped to one.
 */
export async function ensureUserForIdentity(
  provider: string,
  providerUserId: string,
  username?: string,
): Promise<EnsureUserResult> {
  const existing = await findIdentity(provider, providerUserId);

  if (existing) {
    await touchIdentity(existing.identity_id, username);
    await touchUserActivity(existing.user_id);
    const user = await getUserById(existing.user_id);
    if (!user) {
      throw new Error("user_identities row referenced a missing users row");
    }
    return { user, isNewUser: false };
  }

  const user = await createUser({});
  await createIdentity({ userId: user.user_id, provider, providerUserId, username });
  await touchUserActivity(user.user_id);

  return { user, isNewUser: true };
}

export async function setUserPreferredMarketService(
  userId: string,
  marketId: string,
): Promise<UserRow> {
  const marketOk = await recordExists("markets", marketId);
  if (!marketOk) {
    throw badRequest("market_id does not reference an existing market");
  }
  const updated = await setPreferredMarket(userId, marketId);
  if (!updated) {
    throw badRequest("User not found");
  }
  return updated;
}
