import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "../../src/api/server.js";
import { closePool, getPool } from "../../src/config/database.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
// Only set in CI (see .github/workflows/ci.yml) with a fixture value -
// gates the tests that need a real secret to compare against.
const hasWebhookSecret = Boolean(process.env.TELEGRAM_WEBHOOK_SECRET);

describe.skipIf(!hasDatabase)("Telegram webhook", () => {
  const app = buildServer();

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  it.skipIf(hasWebhookSecret)(
    "returns 503 when TELEGRAM_WEBHOOK_SECRET is not configured",
    async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/telegram/webhook",
        payload: { update_id: 1 },
      });
      expect(response.statusCode).toBe(503);
    },
  );

  it.skipIf(!hasWebhookSecret)("rejects a request with the wrong secret token (401)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/telegram/webhook",
      headers: { "x-telegram-bot-api-secret-token": "wrong-secret" },
      payload: { update_id: 1 },
    });
    expect(response.statusCode).toBe(401);
  });

  it.skipIf(!hasWebhookSecret)(
    "accepts a correctly-signed /start update, returns 200, and creates a user identity",
    async () => {
      const telegramUserId = Math.floor(Math.random() * 1_000_000_000);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/telegram/webhook",
        headers: {
          "x-telegram-bot-api-secret-token": process.env.TELEGRAM_WEBHOOK_SECRET as string,
        },
        payload: {
          update_id: 1,
          message: {
            message_id: 1,
            from: { id: telegramUserId, is_bot: false, first_name: "Test", username: "testuser" },
            chat: { id: telegramUserId, type: "private" },
            text: "/start channel",
          },
        },
      });
      expect(response.statusCode).toBe(200);

      const pool = getPool();
      const { rows } = await pool.query(
        "SELECT * FROM user_identities WHERE provider = 'telegram' AND provider_user_id = $1",
        [String(telegramUserId)],
      );
      expect(rows).toHaveLength(1);
    },
  );

  it.skipIf(!hasWebhookSecret)(
    "returns 200 even for a payload with no message (never breaks the webhook contract)",
    async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/telegram/webhook",
        headers: {
          "x-telegram-bot-api-secret-token": process.env.TELEGRAM_WEBHOOK_SECRET as string,
        },
        payload: { update_id: 2 },
      });
      expect(response.statusCode).toBe(200);
    },
  );
});
