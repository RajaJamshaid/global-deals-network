import { sendMessage } from "../telegram-api.client.js";
import type { CommandContext } from "../update-router.js";

export async function handleHelp(ctx: CommandContext): Promise<void> {
  await sendMessage({
    chatId: ctx.chatId,
    text:
      "Global Deals Network Bot\n\n" +
      "/search - Find a product and compare prices\n" +
      "/deals - Active deals for your market\n" +
      "/categories - Browse deal categories\n" +
      "/markets - View or change your country\n" +
      "/help - This message",
  });
}
