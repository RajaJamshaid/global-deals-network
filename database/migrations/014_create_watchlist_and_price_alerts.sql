-- 014_create_watchlist_and_price_alerts.sql
-- Phase 1 (Core Shopping Intelligence): user watchlist + price-alert
-- event log. Channel-agnostic - uses the central users table (011), so
-- Telegram, Mini App, web and future channels share one watchlist.
--
-- user_product_watch: one row per (user, product). Re-watching a
-- product re-activates the same row (is_active) instead of creating
-- a duplicate. target_price is optional - basic watching needs none.
--
-- price_alert_event: append-mostly log of alerts the engine decided
-- to raise. Delivery is a separate step (status: pending -> sent/
-- failed/skipped), so the notification channel can change without
-- touching alert detection. A unique index on
-- (watch_id, history_id, event_type) stops the same price observation
-- from raising the same alert twice.
--
-- Idempotent (IF NOT EXISTS) so a re-run is safe.

CREATE TABLE IF NOT EXISTS user_product_watch (
  watch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  market_id UUID REFERENCES markets (market_id) ON DELETE SET NULL,
  target_price NUMERIC(12, 2) CHECK (target_price IS NULL OR target_price > 0),
  currency TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_product_watch_user_product_unique UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_product_watch_user_active
  ON user_product_watch (user_id, is_active);
-- Alert engine read path: active watchers of a product.
CREATE INDEX IF NOT EXISTS idx_user_product_watch_product_active
  ON user_product_watch (product_id) WHERE is_active;

DROP TRIGGER IF EXISTS trg_user_product_watch_set_updated_at ON user_product_watch;
CREATE TRIGGER trg_user_product_watch_set_updated_at
BEFORE UPDATE ON user_product_watch
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS price_alert_event (
  alert_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES user_product_watch (watch_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants (merchant_id) ON DELETE SET NULL,
  offer_id UUID REFERENCES offers (offer_id) ON DELETE SET NULL,
  history_id UUID REFERENCES product_price_history (history_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('target_price_reached', 'significant_price_drop')),
  trigger_price NUMERIC(12, 2) NOT NULL CHECK (trigger_price >= 0),
  previous_price NUMERIC(12, 2) CHECK (previous_price IS NULL OR previous_price >= 0),
  target_price NUMERIC(12, 2) CHECK (target_price IS NULL OR target_price > 0),
  currency TEXT NOT NULL,
  delivery_channel TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_price_alert_event_status
  ON price_alert_event (status, created_at);
CREATE INDEX IF NOT EXISTS idx_price_alert_event_user_id
  ON price_alert_event (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_alert_event_dedupe
  ON price_alert_event (watch_id, history_id, event_type)
  WHERE history_id IS NOT NULL;
