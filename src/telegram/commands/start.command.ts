import { sendMessage } from "../telegram-api.client.js";
import { ensureUserForTelegram } from "../telegram-user.service.js";
import type { CommandContext } from "../update-router.js";

/**
 * Deep-link onboarding entry point (Stage 1E requirement #4/#5):
 * https://t.me/<BotUsername>?start=channel - Telegram passes
 * whatever follows "start=" as this command's args (e.g. "channel").
 *
 * The bot can only message a user after they explicitly press
 * Start / follow a deep link - simply joining the Channel never
 * grants DM permission, so the intended UX is:
 * Channel post -> "Get Personal Deal Alerts" button (a t.me deep
 * link) -> this command -> registration -> alerts enabled. The
 * button/channel-post side of that flow is not built yet (task said
 * the exact production button can follow once the webhook works);
 * this command is the receiving end of it.
 */
export async function handleStart(ctx: CommandContext): Promise<void> {
  const { isNewUser } = await ensureUserForTelegram(ctx.telegramUserId, ctx.username);
  const source = ctx.args.trim();

  const intro = isNewUser
    ? source === "channel"
      ? "Thanks for joining the Global Deals Network Channel! You're now set up for personal deal alerts here in the bot."
      : "Welcome to Global Deals Network! You're now set up for deal alerts."
    : "Welcome back!";

  await sendMessage({
    chatId: ctx.chatId,
    text:
      `${intro}\n\n` +
      "Use /markets to pick your country, /categories to browse, or /deals to see what's active right now.",
  });
}
