import { env } from "../config/env.js";

/**
 * Minimal Telegram Bot API client using Node 20's built-in fetch -
 * no bot-framework dependency added (grammy/telegraf/etc.), per the
 * Stage 1E task's "prefer the existing Node 20 fetch approach".
 */
const TELEGRAM_API_BASE = "https://api.telegram.org";

function requireBotToken(): string {
  if (!env.telegramBotToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  return env.telegramBotToken;
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

async function callTelegramApi<T>(
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const token = requireBotToken();
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as TelegramApiResponse<T>;
  if (!payload.ok) {
    throw new Error(`Telegram API ${method} failed: ${payload.description ?? "unknown error"}`);
  }
  return payload.result as T;
}

export interface SendMessageOptions {
  chatId: number | string;
  text: string;
}

export async function sendMessage(options: SendMessageOptions): Promise<void> {
  await callTelegramApi("sendMessage", {
    chat_id: options.chatId,
    text: options.text,
    disable_web_page_preview: true,
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  await callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

/** Registers the webhook URL with Telegram. Run via scripts/telegram-set-webhook.ts, not called from the running server. */
export async function setWebhook(url: string, secretToken: string): Promise<void> {
  await callTelegramApi("setWebhook", {
    url,
    secret_token: secretToken,
  });
}
