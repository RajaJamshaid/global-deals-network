import { sendMessage } from "../telegram-api.client.js";
import type { CommandContext } from "../update-router.js";

/**
 * /search stays in the BotFather command menu per the Stage 1E task,
 * but is intentionally not implemented here - GDN's Search
 * Infrastructure (docs/architecture/GDN_Search_Infrastructure_Architecture.md)
 * doesn't exist yet. Reserved/deferred, not silently dropped.
 */
export async function handleHelp(ctx: CommandContext): Promise<void> {
  await sendMessage({
    chatId: ctx.chatId,
    text:
      "Global Deals Network Bot\n\n" +
      "/deals - Active deals for your market\n" +
      "/categories - Browse deal categories\n" +
      "/markets - View or change your country\n" +
      "/help - This message\n\n" +
      "/search is coming soon.",
  });
}
