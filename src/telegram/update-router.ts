import { handleCategories } from "./commands/categories.command.js";
import { handleDeals } from "./commands/deals.command.js";
import { handleHelp } from "./commands/help.command.js";
import { handleMarkets } from "./commands/markets.command.js";
import {
  SEARCH_PROMPT,
  handleSearch,
  handleSearchReply,
} from "./commands/search.command.js";
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
  "/search": handleSearch,
};

/**
 * Routes one Telegram Update to a command handler.
 *
 * Only `message` updates are acted on: text starting with a known
 * "/command", plus the one conversational case /search needs - a plain
 * message that is a reply to the bot's own "what product?" prompt (the
 * prompt uses Telegram's force_reply, so no server-side state is kept).
 * Other free text and callback queries are ignored. The normal Telegram
 * search bar is not something a bot can read, and inline mode is not used.
 */
export async function routeUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message || !message.text || !message.from || message.from.is_bot) {
    return;
  }

  const text = message.text.trim();

  if (!text.startsWith("/")) {
    const replied = message.reply_to_message;
    if (replied?.from?.is_bot === true && replied.text === SEARCH_PROMPT) {
      await handleSearchReply(
        {
          chatId: message.chat.id,
          telegramUserId: message.from.id,
          username: message.from.username,
          args: "",
        },
        text,
      );
    }
    return;
  }

  const [rawCommand, ...rest] = text.split(/\s+/);
  const command = rawCommand.split("@")[0].toLowerCase();
  const args = rest.join(" ");

  const handler = COMMANDS[command];
  if (!handler) {
    await sendMessage({
      chatId: message.chat.id,
      text: "Sorry, I don't recognize that command yet. Send /help to see what I can do.",
    });
    return;
  }

  await handler({
    chatId: message.chat.id,
    telegramUserId: message.from.id,
    username: message.from.username,
    args,
  });
}
