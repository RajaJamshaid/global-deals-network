import { listDeals } from "../../deal/deal.repository.js";
import { getMarketById, listMarkets } from "../../market/market.repository.js";
import { sendMessage } from "../telegram-api.client.js";
import { ensureUserForTelegram } from "../telegram-user.service.js";
import type { CommandContext } from "../update-router.js";

const DEFAULT_MARKET_CODE = "US";

/**
 * Pulls active deals straight from the existing centralized
 * deal.repository - no Telegram-specific deal data, no duplicated
 * query logic, per the Stage 1E task's "all deals... must continue
 * using the existing centralized system".
 */
export async function handleDeals(ctx: CommandContext): Promise<void> {
  const { user } = await ensureUserForTelegram(ctx.telegramUserId, ctx.username);

  let marketId = user.preferred_market_id;
  let marketLabel = "";

  if (marketId) {
    const market = await getMarketById(marketId);
    marketLabel = market ? `${market.name} (${market.code})` : "";
  } else {
    const { rows } = await listMarkets(100, 0);
    const defaultMarket = rows.find((market) => market.code === DEFAULT_MARKET_CODE);
    if (defaultMarket) {
      marketId = defaultMarket.market_id;
      marketLabel = `${defaultMarket.name} (${defaultMarket.code}, default)`;
    }
  }

  if (!marketId) {
    await sendMessage({
      chatId: ctx.chatId,
      text: "No market is configured yet. Try /markets to see available options.",
    });
    return;
  }

  const { rows: deals } = await listDeals({ marketId, status: "active" }, 10, 0);

  if (deals.length === 0) {
    await sendMessage({
      chatId: ctx.chatId,
      text: `No active deals in ${marketLabel} right now. Check back soon!`,
    });
    return;
  }

  const lines = deals.map((deal) => {
    const price = deal.sale_price ? `${deal.sale_price} ${deal.currency}` : "";
    return `- ${deal.title}${price ? ` (${price})` : ""}`;
  });

  await sendMessage({
    chatId: ctx.chatId,
    text: `Active deals in ${marketLabel}:\n${lines.join("\n")}`,
  });
}
