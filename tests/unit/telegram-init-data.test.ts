import { describe, expect, it } from "vitest";
import {
  InitDataError,
  verifyTelegramInitData,
  type InitDataFailureReason,
} from "../../src/telegram/init-data.js";
import { TEST_BOT_TOKEN, buildInitData } from "../helpers/telegram-init-data.js";

const NOW = new Date("2026-10-03T12:00:00Z");
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);
const options = { botToken: TEST_BOT_TOKEN, maxAgeSeconds: 3600, now: NOW };

function reasonOf(fn: () => unknown): InitDataFailureReason | "no error" {
  try {
    fn();
  } catch (error) {
    if (error instanceof InitDataError) return error.reason;
    throw error;
  }
  return "no error";
}

describe("verifyTelegramInitData", () => {
  it("verifies Telegram's documented HMAC scheme against an independent known-answer vector", () => {
    // Hash computed independently with OpenSSL (not with this code):
    //   secret = HMAC_SHA256(key="WebAppData", msg=token)
    //   hash   = HMAC_SHA256(key=secret, msg=data_check_string)
    const initData =
      "auth_date=1700000000&query_id=AAHfixture&user=%7B%22id%22%3A42%2C%22first_name%22%3A%22Test%22%2C%22username%22%3A%22kat_user%22%7D&hash=49ec10cfdbc7a42034133fc382e8c98e9a90eaae1a7ebf2bb745f5c374555eab";
    const result = verifyTelegramInitData(initData, {
      botToken: "123456789:GDN-KAT-FIXTURE-TOKEN-NOT-REAL",
      maxAgeSeconds: 3600,
      now: new Date(1_700_000_010 * 1000),
    });
    expect(result.user.id).toBe(42);
    expect(result.user.username).toBe("kat_user");
    expect(result.user.firstName).toBe("Test");
    expect(result.authDate.getTime()).toBe(1_700_000_000 * 1000);
  });

  it("accepts valid, fresh initData and returns the verified user", () => {
    const initData = buildInitData({
      authDate: NOW_SECONDS - 30,
      user: { id: 777, first_name: "Ada", username: "ada" },
    });
    const result = verifyTelegramInitData(initData, options);
    expect(result.user).toEqual({ id: 777, username: "ada", firstName: "Ada" });
  });

  it("rejects missing initData", () => {
    expect(reasonOf(() => verifyTelegramInitData(undefined, options))).toBe("missing");
    expect(reasonOf(() => verifyTelegramInitData("", options))).toBe("missing");
    expect(reasonOf(() => verifyTelegramInitData(42, options))).toBe("missing");
  });

  it("rejects malformed initData", () => {
    const valid = buildInitData({ authDate: NOW_SECONDS });
    const params = new URLSearchParams(valid);

    const noHash = new URLSearchParams(valid);
    noHash.delete("hash");
    expect(reasonOf(() => verifyTelegramInitData(noHash.toString(), options))).toBe("malformed");

    const badHash = new URLSearchParams(valid);
    badHash.set("hash", "not-a-hex-hash");
    expect(reasonOf(() => verifyTelegramInitData(badHash.toString(), options))).toBe("malformed");

    expect(reasonOf(() => verifyTelegramInitData(`${valid}&auth_date=1`, options))).toBe("malformed");
    expect(reasonOf(() => verifyTelegramInitData(`hash=${"a".repeat(64)}`, options))).toBe("malformed");
    expect(reasonOf(() => verifyTelegramInitData("just-garbage", options))).toBe("malformed");
    expect(reasonOf(() => verifyTelegramInitData("x".repeat(10_000), options))).toBe("malformed");
    expect(params.get("hash")).toBeTruthy();
  });

  it("rejects invalid signatures", () => {
    const valid = buildInitData({ authDate: NOW_SECONDS });

    const tampered = new URLSearchParams(valid);
    tampered.set("user", JSON.stringify({ id: 999, first_name: "Evil" }));
    expect(reasonOf(() => verifyTelegramInitData(tampered.toString(), options))).toBe("bad_signature");

    const wrongToken = buildInitData({ authDate: NOW_SECONDS, botToken: "1:another-token" });
    expect(reasonOf(() => verifyTelegramInitData(wrongToken, options))).toBe("bad_signature");

    const flippedHash = new URLSearchParams(valid);
    const hash = flippedHash.get("hash") as string;
    flippedHash.set("hash", (hash[0] === "0" ? "1" : "0") + hash.slice(1));
    expect(reasonOf(() => verifyTelegramInitData(flippedHash.toString(), options))).toBe("bad_signature");

    const addedField = new URLSearchParams(valid);
    addedField.set("extra", "x");
    expect(reasonOf(() => verifyTelegramInitData(addedField.toString(), options))).toBe("bad_signature");
  });

  it("rejects expired initData and future-dated initData", () => {
    const expired = buildInitData({ authDate: NOW_SECONDS - 3601 });
    expect(reasonOf(() => verifyTelegramInitData(expired, options))).toBe("expired");

    const justInside = buildInitData({ authDate: NOW_SECONDS - 3600 });
    expect(reasonOf(() => verifyTelegramInitData(justInside, options))).toBe("no error");

    const future = buildInitData({ authDate: NOW_SECONDS + 3600 });
    expect(reasonOf(() => verifyTelegramInitData(future, options))).toBe("malformed");
  });

  it("honours the configurable lifetime", () => {
    const twoHoursOld = buildInitData({ authDate: NOW_SECONDS - 7200 });
    expect(reasonOf(() => verifyTelegramInitData(twoHoursOld, options))).toBe("expired");
    expect(
      reasonOf(() => verifyTelegramInitData(twoHoursOld, { ...options, maxAgeSeconds: 86400 })),
    ).toBe("no error");
  });

  it("rejects a missing or non-numeric auth_date", () => {
    const fields = new URLSearchParams(buildInitData({ authDate: NOW_SECONDS }));
    expect(fields.get("auth_date")).toBeTruthy();
    // Re-sign without auth_date / with a bad one so only auth_date is wrong.
    const noAuthDate = buildInitData({ extra: {}, authDate: Number.NaN });
    expect(reasonOf(() => verifyTelegramInitData(noAuthDate, options))).toBe("malformed");
  });

  it("rejects an invalid user object", () => {
    const cases: Array<Record<string, unknown> | null> = [
      null, // no user field at all
      { first_name: "NoId" },
      { id: "123", first_name: "StringId" },
      { id: 1.5, first_name: "Fraction" },
      { id: -5, first_name: "Negative" },
      { id: 12, first_name: "Robot", is_bot: true },
    ];
    for (const user of cases) {
      const initData = buildInitData({ authDate: NOW_SECONDS, user });
      expect(reasonOf(() => verifyTelegramInitData(initData, options))).toBe("invalid_user");
    }
  });

  it("fails closed when no bot token is configured", () => {
    const initData = buildInitData({ authDate: NOW_SECONDS });
    expect(
      reasonOf(() => verifyTelegramInitData(initData, { ...options, botToken: undefined })),
    ).toBe("not_configured");
  });

  it("never puts the token, hash or initData in an error", () => {
    const initData = buildInitData({ authDate: NOW_SECONDS - 100_000 });
    const hash = new URLSearchParams(initData).get("hash") as string;
    try {
      verifyTelegramInitData(initData, options);
      throw new Error("expected a rejection");
    } catch (error) {
      const text = `${(error as Error).message} ${JSON.stringify(error)}`;
      expect(text).not.toContain(TEST_BOT_TOKEN);
      expect(text).not.toContain(hash);
      expect(text).not.toContain(initData);
    }
  });
});
