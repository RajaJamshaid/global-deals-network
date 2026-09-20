import { ensureUserForIdentity, type EnsureUserResult } from "../user/user-identity.service.js";

const TELEGRAM_PROVIDER = "telegram";

/**
 * Thin Telegram-specific wrapper over the generic, channel-agnostic
 * ensureUserForIdentity - this is the only Telegram-aware piece of
 * the user-identity flow; everything else lives in src/user/ and is
 * reusable as-is for a future WhatsApp or Web identity provider.
 */
export async function ensureUserForTelegram(
  telegramUserId: number,
  username?: string,
): Promise<EnsureUserResult> {
  return ensureUserForIdentity(TELEGRAM_PROVIDER, String(telegramUserId), username);
}
