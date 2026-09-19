-- 008_create_affiliate_programs.sql
-- Per docs/architecture/GDN_Affiliate_Architecture.md ("Affiliate
-- Programs") and GDN_Data_Architecture.md ("Affiliate Programs"):
-- a merchant's affiliate program configuration. Stage 1B keeps
-- "network" as a field on this table rather than a separate
-- affiliate_networks table, per the task's "only these core tables"
-- instruction; a dedicated networks table can be split out later
-- without breaking this schema.
--
-- No credentials/API keys are stored here or anywhere in the
-- database - those live in environment variables per
-- docs/architecture/GDN_Affiliate_Architecture.md ("Affiliate
-- Security: API keys server-side only... No affiliate credentials
-- in Git repository").

CREATE TABLE affiliate_programs (
  affiliate_program_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants (merchant_id) ON DELETE CASCADE,
  network_name TEXT NOT NULL,
  external_program_id TEXT,
  program_name TEXT NOT NULL,
  commission_type TEXT NOT NULL DEFAULT 'percentage'
    CHECK (commission_type IN ('percentage', 'fixed', 'tiered', 'hybrid')),
  commission_value NUMERIC(8, 4),
  cookie_duration_days INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'paused', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT affiliate_programs_merchant_network_unique UNIQUE (merchant_id, network_name)
);

CREATE INDEX idx_affiliate_programs_merchant_id ON affiliate_programs (merchant_id);
CREATE INDEX idx_affiliate_programs_status ON affiliate_programs (status);

CREATE TRIGGER trg_affiliate_programs_set_updated_at
BEFORE UPDATE ON affiliate_programs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
