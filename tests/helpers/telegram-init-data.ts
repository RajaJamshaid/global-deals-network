import { createHmac } from "node:crypto";

/**
 * Test-only helpers that build Telegram Mini App initData signed with a
 * FIXTURE bot token. No real Telegram credential is ever used.
 */
export const TEST_BOT_TOKEN = "123456789:GDN-TEST-FIXTURE-BOT-TOKEN-NOT-REAL";

/** Signs `fields` the way Telegram does and returns URL-encoded initData. */
export function signInitData(
  fields: Record<string, string>,
  botToken: string = TEST_BOT_TOKEN,
): string {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}

export interface InitDataOptions {
  botToken?: string;
  /** Pass null to omit the user field entirely. */
  user?: Record<string, unknown> | null;
  /** Unix seconds; defaults to now. */
  authDate?: number;
  extra?: Record<string, string>;
}

export function buildInitData(options: InitDataOptions = {}): string {
  const fields: Record<string, string> = {
    auth_date: String(options.authDate ?? Math.floor(Date.now() / 1000)),
    query_id: "AAHtestfixture",
    ...options.extra,
  };
  if (options.user !== null) {
    fields.user = JSON.stringify(
      options.user ?? { id: 1001, first_name: "Test", username: "test_user" },
    );
  }
  return signInitData(fields, options.botToken);
}

/** `Authorization: tma <initData>` header for a given Telegram user id. */
export function tmaHeaders(
  telegramUserId: number,
  options: Omit<InitDataOptions, "user"> = {},
): Record<string, string> {
  return {
    authorization: `tma ${buildInitData({
      ...options,
      user: { id: telegramUserId, first_name: "Test", username: `test_${telegramUserId}` },
    })}`,
  };
}
