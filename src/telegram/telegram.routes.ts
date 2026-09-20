import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { routeUpdate } from "./update-router.js";
import type { TelegramUpdate } from "./telegram-types.js";

/**
 * POST /api/v1/telegram/webhook
 *
 * Per docs/architecture/GDN_Telegram_Architecture.md section 28
 * (Telegram -> Webhook Endpoint -> API Gateway -> Bot Service ->
 * Business Logic -> Database) and section 36 (Security: webhook
 * protection) - every call is validated against
 * TELEGRAM_WEBHOOK_SECRET via Telegram's own
 * X-Telegram-Bot-Api-Secret-Token header (set via setWebhook's
 * secret_token, see scripts/telegram-set-webhook.ts) before anything
 * is processed.
 *
 * Always returns 200 once the secret check passes, even if
 * downstream processing throws - Telegram retries failed webhook
 * deliveries aggressively, and a slow/broken command handler should
 * never turn into a retry storm. Errors are logged server-side only.
 */
export async function telegramRoutes(app: FastifyInstance): Promise<void> {
  app.post("/telegram/webhook", async (request, reply) => {
    if (!env.telegramWebhookSecret) {
      request.log.error("TELEGRAM_WEBHOOK_SECRET is not configured");
      return reply.status(503).send();
    }

    const providedSecret = request.headers["x-telegram-bot-api-secret-token"];
    if (providedSecret !== env.telegramWebhookSecret) {
      return reply.status(401).send();
    }

    try {
      await routeUpdate(request.body as TelegramUpdate);
    } catch (error) {
      request.log.error(error);
    }

    return reply.status(200).send({ ok: true });
  });
}
