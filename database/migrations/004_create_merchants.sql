-- 004_create_merchants.sql
-- Per docs/architecture/GDN_Data_Architecture.md ("Merchants") and
-- GDN_Affiliate_Architecture.md ("Merchants"): stores/retailers such
-- as Amazon. Market availability for a merchant is expressed later,
-- per-offer (offers.market_id) rather than on the merchant itself,
-- since a merchant can exist globally while being active in select
-- markets only.

CREATE TABLE merchants (
  merchant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  description TEXT,
  merchant_type TEXT NOT NULL DEFAULT 'retailer',
  affiliate_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (affiliate_status IN ('pending', 'active', 'suspended', 'inactive')),
  merchant_status TEXT NOT NULL DEFAULT 'active'
    CHECK (merchant_status IN ('pending', 'active', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT merchants_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_merchants_merchant_status ON merchants (merchant_status);

CREATE TRIGGER trg_merchants_set_updated_at
BEFORE UPDATE ON merchants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
