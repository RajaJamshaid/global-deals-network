import { searchProductsService, type ProductSearchResult } from "../../catalog/product-search.service.js";
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from "../../catalog/search-query.js";
import { env } from "../../config/env.js";
import { getMarketById, listMarkets } from "../../market/market.repository.js";
import { formatMoney, truncate } from "../../seo/html.js";
import { sendMessage } from "../telegram-api.client.js";
import { ensureUserForTelegram } from "../telegram-user.service.js";
import type { CommandContext } from "../update-router.js";

/**
 * Telegram /search. The bot is only another front end: it calls the SAME
 * search service as the web and the API (searchProductsService), and each
 * result button opens the public product landing page - the same product
 * intelligence and price comparison every channel uses, shown in the
 * Telegram Mini App web view. The bot has no pricing or ranking logic of
 * its own, and it never uses or reveals the internal API key.
 *
 * Flow (stateless - Telegram's force_reply keeps the conversation):
 *   /search            -> bot asks "What product do you want to find?"
 *   user replies       -> search + result buttons
 *   /search <query>    -> search straight away
 */
export const SEARCH_PROMPT =
  "What product do you want to find? Reply to this message with a name, brand or model.";

const MAX_RESULTS = 5;

const STATUS_LABELS: Record<string, string> = {
  low: "lower than usual",
  normal: "normal price",
  high: "higher than usual",
};

export async function handleSearch(ctx: CommandContext): Promise<void> {
  if (ctx.args.trim().length === 0) {
    await sendMessage({
      chatId: ctx.chatId,
      text: SEARCH_PROMPT,
      replyMarkup: {
        force_reply: true,
        input_field_placeholder: "e.g. wireless headphones",
        selective: true,
      },
    });
    return;
  }
  await runSearch(ctx, ctx.args);
}

/** The user's answer to the /search prompt. */
export async function handleSearchReply(ctx: CommandContext, text: string): Promise<void> {
  await runSearch(ctx, text);
}

function productUrl(slug: string): string {
  return `${env.siteUrl}/product/${slug}`;
}

/** Telegram only allows web_app buttons on https URLs; fall back to a plain link otherwise (local dev). */
function productButton(result: ProductSearchResult): Record<string, unknown> {
  const text = `Compare: ${truncate(result.name, 40)}`;
  const url = productUrl(result.slug);
  return url.startsWith("https://") ? { text, web_app: { url } } : { text, url };
}

function resultLine(result: ProductSearchResult, index: number): string {
  const best = result.best_offer;
  const parts = [
    `${formatMoney(best.effective_price, best.currency)} at ${best.merchant.name}`,
    `${result.offer_count} ${result.offer_count === 1 ? "offer" : "offers"}`,
  ];
  const statusLabel = STATUS_LABELS[result.price_status.status];
  if (statusLabel) parts.push(statusLabel);
  if (result.deal_score.score !== null) parts.push(`Deal Score ${result.deal_score.score}/100`);
  return `${index + 1}. ${result.name}\n   ${parts.join(" \u00b7 ")}`;
}

async function resolveMarket(
  preferredMarketId: string | null,
): Promise<{ marketId: string; label: string } | null> {
  if (preferredMarketId) {
    const market = await getMarketById(preferredMarketId);
    if (market) return { marketId: market.market_id, label: `${market.name} (${market.code})` };
  }
  const { rows } = await listMarkets(100, 0);
  const fallback = rows.find((market) => market.code === env.defaultMarketCode);
  return fallback ? { marketId: fallback.market_id, label: `${fallback.name} (${fallback.code})` } : null;
}

async function runSearch(ctx: CommandContext, rawQuery: string): Promise<void> {
  const query = rawQuery.trim().replace(/\s+/g, " ");
  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    await sendMessage({
      chatId: ctx.chatId,
      text: `Please send a product name between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters. Try /search again.`,
    });
    return;
  }

  try {
    const { user } = await ensureUserForTelegram(ctx.telegramUserId, ctx.username);
    const market = await resolveMarket(user.preferred_market_id);
    if (!market) {
      await sendMessage({
        chatId: ctx.chatId,
        text: "No market is configured yet. Try /markets to see available options.",
      });
      return;
    }

    const { rows, total } = await searchProductsService(
      { q: query, market_id: market.marketId },
      MAX_RESULTS,
      0,
    );
    if (rows.length === 0) {
      await sendMessage({
        chatId: ctx.chatId,
        text: `No products found for "${query}" in ${market.label}. Try a different name, brand or model.`,
      });
      return;
    }

    const more = total > rows.length ? `\n\nShowing ${rows.length} of ${total} results.` : "";
    await sendMessage({
      chatId: ctx.chatId,
      text:
        `Results for "${query}" in ${market.label}:\n\n${rows.map(resultLine).join("\n\n")}${more}\n\n` +
        "Tap a button to compare prices. Prices and availability may change.",
      replyMarkup: { inline_keyboard: rows.map((row) => [productButton(row)]) },
    });
  } catch (error) {
    console.error("Telegram /search failed:", error instanceof Error ? error.message : "unknown error");
    await sendMessage({
      chatId: ctx.chatId,
      text: "Search is unavailable right now. Please try again later.",
    }).catch(() => undefined);
  }
}
