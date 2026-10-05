import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { TelegramUpdate } from "../../src/telegram/telegram-types.js";

// Capture what the bot would send; nothing ever reaches Telegram.
vi.mock("../../src/telegram/telegram-api.client.js", () => ({
  sendMessage: vi.fn(async () => undefined),
  answerCallbackQuery: vi.fn(async () => undefined),
  setWebhook: vi.fn(async () => undefined),
}));

import { searchProductsService } from "../../src/catalog/product-search.service.js";
import { closePool } from "../../src/config/database.js";
import { env } from "../../src/config/env.js";
import { SEARCH_PROMPT } from "../../src/telegram/commands/search.command.js";
import { sendMessage } from "../../src/telegram/telegram-api.client.js";
import { routeUpdate } from "../../src/telegram/update-router.js";
import { buildAuthedServer, getSeededMarketId, uniqueSlug } from "./test-helpers.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const sent = vi.mocked(sendMessage);

let idCounter = 0;
function newUserId(): number {
  idCounter += 1;
  return 500_000_000 + Math.floor(Math.random() * 1_000_000_000) + idCounter;
}

function message(
  userId: number,
  text: string,
  replyTo?: { text: string; fromBot: boolean },
): TelegramUpdate {
  return {
    update_id: 1,
    message: {
      message_id: 10,
      from: { id: userId, is_bot: false, first_name: "Tester", username: `tester_${userId}` },
      chat: { id: userId, type: "private" },
      text,
      ...(replyTo
        ? {
            reply_to_message: {
              message_id: 9,
              from: { id: 1, is_bot: replyTo.fromBot, first_name: "GDN Bot" },
              chat: { id: userId, type: "private" },
              text: replyTo.text,
            },
          }
        : {}),
    },
  };
}

function lastCall(): { chatId: number | string; text: string; replyMarkup?: Record<string, any> } {
  const calls = sent.mock.calls;
  const call = calls[calls.length - 1];
  if (!call) throw new Error("no message was sent");
  return call[0] as { chatId: number | string; text: string; replyMarkup?: Record<string, any> };
}

describe.skipIf(!hasDatabase)("Telegram /search", () => {
  const app = buildAuthedServer();

  beforeEach(() => {
    sent.mockClear();
  });

  afterAll(async () => {
    await app.close();
    await closePool();
  });

  async function productWithOffer(
    name: string,
    price: number,
    merchantName = "Telegram Store",
  ): Promise<{ productId: string; slug: string }> {
    const marketId = await getSeededMarketId(app);
    const product = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      payload: { name, slug: uniqueSlug("tg-product") },
    });
    const { product_id: productId, slug } = product.json().data;
    const merchant = await app.inject({
      method: "POST",
      url: "/api/v1/merchants",
      payload: { name: merchantName, slug: uniqueSlug("tg-merchant") },
    });
    await app.inject({
      method: "POST",
      url: "/api/v1/offers",
      payload: {
        product_id: productId,
        merchant_id: merchant.json().data.merchant_id,
        market_id: marketId,
        offer_url: "https://example.com/tg",
        price,
        currency: "USD",
      },
    });
    return { productId, slug };
  }

  function token(): string {
    return `tg${Math.random().toString(36).slice(2, 10)}`;
  }

  it("/search with no query asks what to find, using force_reply", async () => {
    await routeUpdate(message(newUserId(), "/search"));
    expect(sent).toHaveBeenCalledTimes(1);
    expect(lastCall().text).toBe(SEARCH_PROMPT);
    expect(lastCall().replyMarkup?.force_reply).toBe(true);

    sent.mockClear();
    await routeUpdate(message(newUserId(), "/search   "));
    expect(lastCall().text).toBe(SEARCH_PROMPT);
  });

  it("searches when the user replies to the prompt, with a button to the product page", async () => {
    const word = token();
    const { slug } = await productWithOffer(`${word} Headphones`, 80, "Bot Test Store");

    await routeUpdate(message(newUserId(), word, { text: SEARCH_PROMPT, fromBot: true }));

    const reply = lastCall();
    expect(reply.text).toContain(`Results for "${word}"`);
    expect(reply.text).toContain(`${word} Headphones`);
    expect(reply.text).toContain("USD 80.00 at Bot Test Store");
    expect(reply.text).toContain("1 offer");
    expect(reply.text).toContain("Prices and availability may change.");

    // One button per result, opening the public product landing page (Mini App / web view).
    const buttons = reply.replyMarkup?.inline_keyboard.flat();
    expect(buttons).toHaveLength(1);
    const link = buttons[0].web_app?.url ?? buttons[0].url;
    expect(link).toBe(`${env.siteUrl}/product/${slug}`);
    expect(buttons[0].text).toContain("Compare:");
  });

  it("uses the SAME search service as the API (identical best price)", async () => {
    const word = token();
    await productWithOffer(`${word} Speaker`, 64.5);
    const marketId = await getSeededMarketId(app);
    const viaService = await searchProductsService({ q: word, market_id: marketId }, 5, 0);
    expect(viaService.rows).toHaveLength(1);

    await routeUpdate(message(newUserId(), `/search ${word}`));
    expect(lastCall().text).toContain(
      `USD ${viaService.rows[0]?.best_offer.effective_price.toFixed(2)} at Telegram Store`,
    );
  });

  it("/search <query> searches straight away", async () => {
    const word = token();
    await productWithOffer(`${word} Keyboard`, 30);
    await routeUpdate(message(newUserId(), `/search ${word} keyboard`));
    expect(lastCall().text).toContain(`${word} Keyboard`);
  });

  it("says plainly when nothing matches", async () => {
    const word = token();
    await routeUpdate(message(newUserId(), `/search ${word}nomatch`));
    expect(lastCall().text).toContain("No products found");
    expect(lastCall().replyMarkup).toBeUndefined();
  });

  it("rejects an empty, too short or too long query without searching", async () => {
    for (const text of ["a", "x".repeat(150)]) {
      sent.mockClear();
      await routeUpdate(message(newUserId(), `/search ${text}`));
      expect(lastCall().text).toContain("between 2 and 100 characters");
    }
    sent.mockClear();
    await routeUpdate(message(newUserId(), "a", { text: SEARCH_PROMPT, fromBot: true }));
    expect(lastCall().text).toContain("between 2 and 100 characters");
  });

  it("treats SQL-looking input as plain text", async () => {
    await routeUpdate(message(newUserId(), "/search '; DROP TABLE products; --"));
    expect(lastCall().text).toContain("No products found");
  });

  it("ignores ordinary chat, replies to other messages, and bot messages", async () => {
    await routeUpdate(message(newUserId(), "hello there"));
    await routeUpdate(message(newUserId(), "headphones", { text: "Some other message", fromBot: true }));
    await routeUpdate(message(newUserId(), "headphones", { text: SEARCH_PROMPT, fromBot: false }));
    expect(sent).not.toHaveBeenCalled();
  });

  it("lists /search in /help", async () => {
    await routeUpdate(message(newUserId(), "/help"));
    expect(lastCall().text).toContain("/search");
    expect(lastCall().text).not.toContain("coming soon");
  });

  it("never exposes the internal API key, bearer tokens or the bot token in anything it sends", async () => {
    const word = token();
    await productWithOffer(`${word} Mouse`, 12);
    await routeUpdate(message(newUserId(), `/search ${word}`));
    await routeUpdate(message(newUserId(), "/search"));

    const everything = JSON.stringify(sent.mock.calls);
    expect(everything).not.toContain(process.env.GDN_INTERNAL_API_KEY as string);
    expect(everything).not.toMatch(/Bearer|initData|authorization/i);
    if (env.telegramBotToken) expect(everything).not.toContain(env.telegramBotToken);
  });
});
