-- 009_create_affiliate_links.sql
-- Per docs/architecture/GDN_Affiliate_Architecture.md ("Affiliate
-- Links", "Affiliate Governance Rules: Affiliate links centralized
-- hon... Affiliate data central database se serve ho"): the single
-- centralized affiliate-link record every channel (web, Telegram,
-- Mini App, ...) consumes. No channel creates its own affiliate
-- links or duplicates this logic.

CREATE TABLE affiliate_links (
  affiliate_link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_program_id UUID NOT NULL REFERENCES affiliate_programs (affiliate_program_id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants (merchant_id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals (deal_id) ON DELETE SET NULL,
  product_id UUID REFERENCES products (product_id) ON DELETE SET NULL,
  destination_url TEXT NOT NULL,
  affiliate_url TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('created', 'validated', 'active', 'paused', 'expired', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliate_links_affiliate_program_id ON affiliate_links (affiliate_program_id);
CREATE INDEX idx_affiliate_links_merchant_id ON affiliate_links (merchant_id);
CREATE INDEX idx_affiliate_links_deal_id ON affiliate_links (deal_id);
CREATE INDEX idx_affiliate_links_product_id ON affiliate_links (product_id);
CREATE INDEX idx_affiliate_links_status ON affiliate_links (status);

CREATE TRIGGER trg_affiliate_links_set_updated_at
BEFORE UPDATE ON affiliate_links
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
