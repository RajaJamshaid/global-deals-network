import { env } from "../src/config/env.js";
import { setWebhook } from "../src/telegram/telegram-api.client.js";

/**
 * One-off/manual script to register the webhook URL with Telegram.
 * Not called from the running server - run this once per deployment
 * (or whenever the URL changes) via:
 *   npm run telegram:set-webhook -- https://your-domain/api/v1/telegram/webhook
 */
async function run(): Promise<void> {
  const url = process.argv[2];
  if (!url) {
    console.error(
      "Usage: npm run telegram:set-webhook -- https://your-domain/api/v1/telegram/webhook",
    );
    process.exitCode = 1;
    return;
  }
  if (!env.telegramWebhookSecret) {
    console.error("TELEGRAM_WEBHOOK_SECRET is not set");
    process.exitCode = 1;
    return;
  }

  await setWebhook(url, env.telegramWebhookSecret);
  console.log(`Webhook set to ${url}`);
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
