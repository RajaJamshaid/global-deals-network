-- 007_create_deals.sql
-- Per docs/architecture/GDN_Data_Architecture.md ("Deals") and the
-- Stage 1B task: deal-level information, separate from the underlying
-- product/offer. offer_id/product_id are nullable because a deal can
-- exist (e.g. a coupon-only promotion) without a specific catalog
-- offer attached yet.

CREATE TABLE deals (
  deal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES offers (offer_id) ON DELETE SET NULL,
  product_id UUID REFERENCES products (product_id) ON DELETE SET NULL,
  merchant_id UUID NOT NULL REFERENCES merchants (merchant_id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories (category_id) ON DELETE SET NULL,
  market_id UUID NOT NULL REFERENCES markets (market_id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  deal_type TEXT NOT NULL DEFAULT 'discount',
  original_price NUMERIC(12, 2) CHECK (original_price >= 0),
  sale_price NUMERIC(12, 2) CHECK (sale_price >= 0),
  discount_percentage NUMERIC(5, 2)
    CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  currency TEXT NOT NULL,
  coupon_code TEXT,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  deal_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (deal_status IN (
      'draft', 'pending_review', 'active', 'paused',
      'expired', 'rejected', 'archived'
    )),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'verified', 'flagged')),
  featured_status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT deals_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_deals_merchant_id ON deals (merchant_id);
CREATE INDEX idx_deals_market_id ON deals (market_id);
CREATE INDEX idx_deals_category_id ON deals (category_id);
CREATE INDEX idx_deals_product_id ON deals (product_id);
CREATE INDEX idx_deals_offer_id ON deals (offer_id);
CREATE INDEX idx_deals_deal_status ON deals (deal_status);
CREATE INDEX idx_deals_expires_at ON deals (expires_at);
CREATE INDEX idx_deals_market_status ON deals (market_id, deal_status);

CREATE TRIGGER trg_deals_set_updated_at
BEFORE UPDATE ON deals
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
