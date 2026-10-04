import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Telegram Mini App initData verification, following Telegram's
 * documented HMAC scheme ("Validating data received via the Mini App"):
 *
 *   data_check_string = every received field EXCEPT `hash`, sorted
 *                       alphabetically, as "key=value" joined by "\n"
 *   secret_key        = HMAC_SHA256(key = "WebAppData", message = bot_token)
 *   expected_hash     = hex(HMAC_SHA256(key = secret_key, message = data_check_string))
 *
 * The comparison is constant-time. The signed `auth_date` must be
 * recent (configurable lifetime) so a leaked initData stops working.
 *
 * Nothing from the request is trusted until the signature has been
 * verified, and nothing sensitive ever appears in an error: failures
 * carry only a short machine reason, never the token, the hash or the
 * initData itself, so errors are safe to log.
 */
export type InitDataFailureReason =
  | "missing"
  | "malformed"
  | "bad_signature"
  | "expired"
  | "invalid_user"
  | "not_configured";

export class InitDataError extends Error {
  readonly reason: InitDataFailureReason;

  constructor(reason: InitDataFailureReason) {
    super(`Telegram initData rejected: ${reason}`);
    this.reason = reason;
  }
}

export interface VerifiedTelegramUser {
  id: number;
  username?: string;
  firstName?: string;
}

export interface VerifiedInitData {
  user: VerifiedTelegramUser;
  authDate: Date;
}

export interface VerifyInitDataOptions {
  /** Undefined = Telegram auth is not configured; every call fails closed. */
  botToken: string | undefined;
  /** initData older than this many seconds is rejected. */
  maxAgeSeconds: number;
  /** Test hook; defaults to the current time. */
  now?: Date;
  /** How far in the future auth_date may be (clock skew). Default 60s. */
  maxFutureSkewSeconds?: number;
}

const HASH_PATTERN = /^[0-9a-f]{64}$/i;
const AUTH_DATE_PATTERN = /^\d{1,12}$/;
const MAX_INIT_DATA_LENGTH = 8192;
const DEFAULT_FUTURE_SKEW_SECONDS = 60;

export function verifyTelegramInitData(
  initData: unknown,
  options: VerifyInitDataOptions,
): VerifiedInitData {
  if (typeof initData !== "string" || initData.length === 0) {
    throw new InitDataError("missing");
  }
  if (!options.botToken) {
    throw new InitDataError("not_configured");
  }
  if (initData.length > MAX_INIT_DATA_LENGTH) {
    throw new InitDataError("malformed");
  }

  // Parse into fields. A repeated key would make the signed content
  // ambiguous, so it is rejected outright.
  const fields = new Map<string, string>();
  for (const [key, value] of new URLSearchParams(initData).entries()) {
    if (fields.has(key)) {
      throw new InitDataError("malformed");
    }
    fields.set(key, value);
  }

  const providedHash = fields.get("hash");
  if (providedHash === undefined || !HASH_PATTERN.test(providedHash)) {
    throw new InitDataError("malformed");
  }
  fields.delete("hash");
  if (fields.size === 0) {
    throw new InitDataError("malformed");
  }

  // --- signature (before anything else in the payload is used) ---
  const dataCheckString = [...fields.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData")
    .update(options.botToken)
    .digest();
  const expected = createHmac("sha256", secretKey).update(dataCheckString).digest();
  const provided = Buffer.from(providedHash, "hex");
  if (provided.length !== expected.length || !timingSafeEqual(expected, provided)) {
    throw new InitDataError("bad_signature");
  }

  // --- freshness (auth_date is part of the signed data) ---
  const authDateRaw = fields.get("auth_date");
  if (authDateRaw === undefined || !AUTH_DATE_PATTERN.test(authDateRaw)) {
    throw new InitDataError("malformed");
  }
  const authDateSeconds = Number(authDateRaw);
  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const skew = options.maxFutureSkewSeconds ?? DEFAULT_FUTURE_SKEW_SECONDS;
  if (authDateSeconds > nowSeconds + skew) {
    throw new InitDataError("malformed");
  }
  if (nowSeconds - authDateSeconds > options.maxAgeSeconds) {
    throw new InitDataError("expired");
  }

  // --- user ---
  const rawUser = fields.get("user");
  if (rawUser === undefined) {
    throw new InitDataError("invalid_user");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawUser);
  } catch {
    throw new InitDataError("invalid_user");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new InitDataError("invalid_user");
  }
  const user = parsed as Record<string, unknown>;
  if (
    typeof user.id !== "number" ||
    !Number.isSafeInteger(user.id) ||
    user.id <= 0 ||
    user.is_bot === true
  ) {
    throw new InitDataError("invalid_user");
  }

  return {
    user: {
      id: user.id,
      username:
        typeof user.username === "string" && user.username.length <= 64
          ? user.username
          : undefined,
      firstName:
        typeof user.first_name === "string" && user.first_name.length <= 256
          ? user.first_name
          : undefined,
    },
    authDate: new Date(authDateSeconds * 1000),
  };
}
