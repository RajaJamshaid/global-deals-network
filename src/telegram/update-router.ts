import { handleCategories } from "./commands/categories.command.js";
import { handleDeals } from "./commands/deals.command.js";
import { handleHelp } from "./commands/help.command.js";
import { handleMarkets } from "./commands/markets.command.js";
import { handleStart } from "./commands/start.command.js";
import { sendMessage } from "./telegram-api.client.js";
import type { TelegramUpdate } from "./telegram-types.js";

export interface CommandContext {
  chatId: number;
  telegramUserId: number;
  username?: string;
  args: string;
}

type CommandHandler = (ctx: CommandContext) => Promise<void>;

const COMMANDS: Record<string, CommandHandler> = {
  "/start": handleStart,
  "/help": handleHelp,
  "/markets": handleMarkets,
  "/categories": handleCategories,
  "/deals": handleDeals,
};

/**
 * Routes one Telegram Update to a command handler.
 *
 * Stage 1E scope: only `message` updates with text starting with a
 * known "/command" are acted on. Callback queries (inline button
 * taps) and free-text messages are intentionally not handled yet -
 * /search is deliberately absent from COMMANDS (see help.command.ts)
 * even though it stays in the BotFather menu.
 */
export async function routeUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message || !message.text || !message.from || message.from.is_bot) {
    return;
  }

  const [rawCommand, ...rest] = message.text.trim().split(/\s+/);
  const command = rawCommand.split("@")[0].toLowerCase();
  const args = rest.join(" ");

  const handler = COMMANDS[command];
  if (!handler) {
    if (command.startsWith("/")) {
      await sendMessage({
        chatId: message.chat.id,
        text: "Sorry, I don't recognize that command yet. Send /help to see what I can do.",
      });
    }
    return;
  }

  await handler({
    chatId: message.chat.id,
    telegramUserId: message.from.id,
    username: message.from.username,
    args,
  });
}
