import type { FastifyReply, FastifyRequest } from "fastify";
import { unauthorized } from "../api/http/errors.js";
import { InitDataError, verifyTelegramInitData } from "../telegram/init-data.js";
import { ensureUserForTelegram } from "../telegram/telegram-user.service.js";

/**
 * User authentication for the Telegram Mini App (user-scoped routes).
 *
 * Completely separate from the internal API key:
 *   - internal writers send   Authorization: Bearer <GDN_INTERNAL_API_KEY>
 *   - Mini App users send     Authorization: tma <initData>
 * Neither credential is accepted in place of the other.
 *
 * Two pieces:
 *   1. createTelegramAuthHook()  - a root hook that, when a `tma`
 *      credential is present, verifies it (HMAC + freshness) and maps
 *      the verified Telegram user onto the EXISTING users /
 *      user_identities tables. It sets request.user on success and
 *      silently leaves it null otherwise, so public routes keep
 *      working for anonymous or stale clients.
 *   2. requireUser() - a route-level hook for user-scoped routes that
 *      answers 401 when request.user is not set.
 *
 * The verified Telegram id is the only identity ever used; nothing
 * the client claims outside the signed initData is trusted. initData,
 * its hash and the bot token are never logged or returned.
 */
export interface AuthenticatedUser {
  /** Internal GDN user id (users.user_id). */
  userId: string;
  telegramUserId: number;
}

declare module "fastify" {
  interface FastifyRequest {
    user: AuthenticatedUser | null;
  }
}

export interface TelegramAuthOptions {
  /** Undefined = not configured: every Telegram credential is rejected. */
  botToken: string | undefined;
  maxAgeSeconds: number;
}

const TMA_HEADER_PATTERN = /^tma[ \t]+(\S+)$/i;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "23505"
  );
}

async function resolveInternalUser(telegramUserId: number, username?: string) {
  try {
    return await ensureUserForTelegram(telegramUserId, username);
  } catch (error) {
    // Two first-time requests racing to create the same identity: the
    // loser hits the unique constraint, so look the identity up again.
    if (isUniqueViolation(error)) {
      return ensureUserForTelegram(telegramUserId, username);
    }
    throw error;
  }
}

export function createTelegramAuthHook(options: TelegramAuthOptions) {
  return async function telegramAuthHook(request: FastifyRequest): Promise<void> {
    const header = request.headers.authorization;
    if (typeof header !== "string") {
      return;
    }
    const match = TMA_HEADER_PATTERN.exec(header.trim());
    if (!match) {
      // Not a Telegram credential (for example the internal API key).
      return;
    }

    let verified;
    try {
      verified = verifyTelegramInitData(match[1], {
        botToken: options.botToken,
        maxAgeSeconds: options.maxAgeSeconds,
      });
    } catch (error) {
      // Log only the machine reason - never the credential itself.
      request.log.warn(
        { reason: error instanceof InitDataError ? error.reason : "unexpected" },
        "Telegram initData rejected",
      );
      return;
    }

    try {
      const { user } = await resolveInternalUser(
        verified.user.id,
        verified.user.username,
      );
      request.user = {
        userId: user.user_id,
        telegramUserId: verified.user.id,
      };
    } catch (error) {
      request.log.error(
        { err: error instanceof Error ? error.message : "unknown" },
        "Telegram user lookup failed",
      );
    }
  };
}

/** Route-level guard: 401 unless a verified Telegram user is attached. */
export async function requireUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.user) {
    reply.header("WWW-Authenticate", "tma");
    throw unauthorized();
  }
}
