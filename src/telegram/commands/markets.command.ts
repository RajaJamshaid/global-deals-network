import { listMarkets } from "../../market/market.repository.js";
import { setUserPreferredMarketService } from "../../user/user-identity.service.js";
import { sendMessage } from "../telegram-api.client.js";
import { ensureUserForTelegram } from "../telegram-user.service.js";
import type { CommandContext } from "../update-router.js";

/**
 * /markets            -> lists available markets
 * /markets <CODE>     -> sets the user's preferred_market_id
 */
export async function handleMarkets(ctx: CommandContext): Promise<void> {
  const arg = ctx.args.trim().toUpperCase();

  if (arg) {
    const { rows } = await listMarkets(100, 0);
    const match = rows.find((market) => market.code === arg);
    if (!match) {
      await sendMessage({
        chatId: ctx.chatId,
        text: `I don't recognize the market code "${arg}". Send /markets with no arguments to see the list.`,
      });
      return;
    }

    const { user } = await ensureUserForTelegram(ctx.telegramUserId, ctx.username);
    await setUserPreferredMarketService(user.user_id, match.market_id);

    await sendMessage({
      chatId: ctx.chatId,
      text: `Your market is now set to ${match.name} (${match.code}). Try /deals to see what's active there.`,
    });
    return;
  }

  const { rows } = await listMarkets(100, 0);
  const lines = rows.map((market) => `${market.code} - ${market.name}`);
  await sendMessage({
    chatId: ctx.chatId,
    text:
      `Available markets:\n${lines.join("\n")}\n\n` +
      "Send /markets <code> (e.g. /markets US) to set your preferred market.",
  });
}
