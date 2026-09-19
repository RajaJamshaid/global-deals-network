-- 002_create_markets.sql
-- Per docs/architecture/GDN_Data_Architecture.md ("Countries & Regions")
-- and the Stage 1B task's "markets" table: represents a country/region
-- GDN operates in. Seeded with USA only for Stage 1; built to support
-- future markets without redesign.

CREATE TABLE markets (
  market_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  language TEXT NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'paused', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT markets_code_unique UNIQUE (code)
);

CREATE INDEX idx_markets_status ON markets (status);

CREATE TRIGGER trg_markets_set_updated_at
BEFORE UPDATE ON markets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
