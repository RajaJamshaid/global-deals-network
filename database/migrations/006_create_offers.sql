-- 006_create_offers.sql
-- Per docs/architecture/GDN_Database_Implementation_Architecture.md
-- ("Offer Tables", "Offer Principle: An Offer represents a specific
-- merchant/store listing of a canonical Product") and the Stage 1B
-- task: the same product can have offers from multiple merchants,
-- and offer availability/pricing is market-specific.

CREATE TABLE offers (
  offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants (merchant_id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets (market_id) ON DELETE RESTRICT,
  offer_url TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(12, 2) CHECK (original_price >= 0),
  currency TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'new'
    CHECK (condition IN ('new', 'used', 'refurbished', 'open_box', 'unknown')),
  availability_status TEXT NOT NULL DEFAULT 'in_stock'
    CHECK (availability_status IN ('in_stock', 'out_of_stock', 'unknown')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'expired', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Prevents duplicate active listings of the same product, by the
  -- same merchant, in the same market (Database_Implementation_
  -- Architecture.md "Offer Deduplication").
  CONSTRAINT offers_product_merchant_market_unique UNIQUE (product_id, merchant_id, market_id)
);

CREATE INDEX idx_offers_product_id ON offers (product_id);
CREATE INDEX idx_offers_merchant_id ON offers (merchant_id);
CREATE INDEX idx_offers_market_id ON offers (market_id);
CREATE INDEX idx_offers_status ON offers (status);
CREATE INDEX idx_offers_merchant_status ON offers (merchant_id, status);

CREATE TRIGGER trg_offers_set_updated_at
BEFORE UPDATE ON offers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
