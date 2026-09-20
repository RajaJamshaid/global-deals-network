import { closePool } from "../src/config/database.js";
import { env } from "../src/config/env.js";
import { getDealById } from "../src/deal/deal.repository.js";
import { sendMessage } from "../src/telegram/telegram-api.client.js";

/**
 * Manually posts one deal to the GDN Telegram Channel.
 *
 * Deliberately NOT a public API route: no admin
 * authentication/authorization system exists in this repository yet
 * (docs/architecture/GDN_Identity_Authentication_Architecture.md
 * describes one, but it isn't implemented), so an unauthenticated
 * "post to our Channel" endpoint would be a real risk. This stays a
 * manually- or cron-run script until that exists.
 *
 * Usage: npm run telegram:post-deal -- <deal_id>
 */
async function run(): Promise<void> {
  const dealId = process.argv[2];
  if (!dealId) {
    console.error("Usage: npm run telegram:post-deal -- <deal_id>");
    process.exitCode = 1;
    return;
  }
  if (!env.telegramChannelId) {
    console.error("TELEGRAM_CHANNEL_ID is not set");
    process.exitCode = 1;
    return;
  }

  const deal = await getDealById(dealId);
  if (!deal) {
    console.error(`Deal ${dealId} not found`);
    process.exitCode = 1;
    return;
  }

  const price = deal.sale_price ? `${deal.sale_price} ${deal.currency}` : "";
  await sendMessage({
    chatId: env.telegramChannelId,
    text: `${deal.title}${price ? `\n${price}` : ""}`,
  });

  console.log(`Posted deal ${dealId} to channel ${env.telegramChannelId}`);
}

run()
  .then(() => closePool())
  .catch(async (error: unknown) => {
    console.error(error);
    await closePool();
    process.exitCode = 1;
  });
