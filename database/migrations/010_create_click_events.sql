-- 010_create_click_events.sql
-- Per docs/architecture/GDN_Affiliate_Architecture.md ("Click
-- Tracking") and GDN_Data_Architecture.md ("Click Tracking"):
-- centralized tracking of affiliate/deal clicks, with channel/source
-- attribution so Telegram, web, and future channels all funnel
-- through the same tracking table rather than each keeping their own.
--
-- No updated_at/trigger here - click events are an append-only log,
-- never updated after being written.

CREATE TABLE click_events (
  click_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID REFERENCES affiliate_links (affiliate_link_id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals (deal_id) ON DELETE SET NULL,
  product_id UUID REFERENCES products (product_id) ON DELETE SET NULL,
  merchant_id UUID REFERENCES merchants (merchant_id) ON DELETE SET NULL,
  market_id UUID REFERENCES markets (market_id) ON DELETE SET NULL,
  session_id TEXT,
  channel TEXT NOT NULL DEFAULT 'web'
    CHECK (channel IN (
      'web', 'telegram_bot', 'telegram_mini_app',
      'email', 'sms', 'social', 'partner', 'other'
    )),
  campaign_id TEXT,
  placement TEXT,
  device_type TEXT,
  referrer TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_click_events_affiliate_link_id ON click_events (affiliate_link_id);
CREATE INDEX idx_click_events_deal_id ON click_events (deal_id);
CREATE INDEX idx_click_events_merchant_id ON click_events (merchant_id);
CREATE INDEX idx_click_events_occurred_at ON click_events (occurred_at);
CREATE INDEX idx_click_events_channel ON click_events (channel);
