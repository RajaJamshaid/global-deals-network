import { getPool } from "../config/database.js";

const CHANNELS = [
  "web",
  "telegram_bot",
  "telegram_mini_app",
  "email",
  "sms",
  "social",
  "partner",
  "other",
] as const;
export type ClickChannel = (typeof CHANNELS)[number];

export function isClickChannel(value: unknown): value is ClickChannel {
  return typeof value === "string" && (CHANNELS as readonly string[]).includes(value);
}

export interface CreateClickEventInput {
  affiliateLinkId?: string | null;
  dealId?: string | null;
  productId?: string | null;
  merchantId?: string | null;
  marketId?: string | null;
  sessionId?: string;
  channel: ClickChannel;
  campaignId?: string;
  placement?: string;
  deviceType?: string;
  referrer?: string;
}

/**
 * Only the fields already defined by the click_events schema
 * (Stage 1B) are captured - no new tracking fields invented, per the
 * Stage 1D task's "Do not invent excessive tracking fields".
 */
export async function recordClickEvent(input: CreateClickEventInput): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO click_events (
       affiliate_link_id, deal_id, product_id, merchant_id, market_id,
       session_id, channel, campaign_id, placement, device_type, referrer
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      input.affiliateLinkId ?? null,
      input.dealId ?? null,
      input.productId ?? null,
      input.merchantId ?? null,
      input.marketId ?? null,
      input.sessionId ?? null,
      input.channel,
      input.campaignId ?? null,
      input.placement ?? null,
      input.deviceType ?? null,
      input.referrer ?? null,
    ],
  );
}
