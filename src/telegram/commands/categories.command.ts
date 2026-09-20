import { listCategories } from "../../catalog/category.repository.js";
import { sendMessage } from "../telegram-api.client.js";
import type { CommandContext } from "../update-router.js";

export async function handleCategories(ctx: CommandContext): Promise<void> {
  const { rows } = await listCategories(50, 0);
  if (rows.length === 0) {
    await sendMessage({ chatId: ctx.chatId, text: "No categories are available yet." });
    return;
  }
  const lines = rows.map((category) => `- ${category.name}`);
  await sendMessage({
    chatId: ctx.chatId,
    text: `Deal categories:\n${lines.join("\n")}`,
  });
}
