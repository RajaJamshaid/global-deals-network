-- 013_create_product_price_history.sql
-- Phase 1 (Core Shopping Intelligence): append-only log of observed
-- prices per product/merchant/market. Merchant-agnostic - Amazon,
-- Walmart, eBay etc. all write the same shape. Feeds price status,
-- Deal Score and the price-history chart.
--
-- is_fixture marks seed/mock/test observations so they can be excluded
-- from price intelligence (and never shown as live merchant pricing).
-- source records where the observation came from.
--
-- Append-only: no updated_at/trigger (same pattern as click_events).
-- Idempotent (IF NOT EXISTS) so a re-run is safe.

CREATE TABLE IF NOT EXISTS product_price_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants (merchant_id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets (market_id) ON DELETE RESTRICT,
  offer_id UUID REFERENCES offers (offer_id) ON DELETE SET NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'offer_update'
    CHECK (source IN ('offer_update', 'feed_import', 'manual', 'fixture')),
  is_fixture BOOLEAN NOT NULL DEFAULT FALSE,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Main read path: one product within one market, newest first.
CREATE INDEX IF NOT EXISTS idx_price_history_product_market_observed
  ON product_price_history (product_id, market_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_merchant_id
  ON product_price_history (merchant_id);
CREATE INDEX IF NOT EXISTS idx_price_history_offer_id
  ON product_price_history (offer_id);
