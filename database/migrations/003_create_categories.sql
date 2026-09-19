-- 003_create_categories.sql
-- Per docs/architecture/GDN_Data_Architecture.md ("Categories") and
-- GDN_Database_Implementation_Architecture.md ("Category Tables",
-- "Hierarchy"): reusable global categories with parent-child support,
-- not Amazon-specific hard-coded categories.

CREATE TABLE categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_category_id UUID REFERENCES categories (category_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_categories_parent_category_id ON categories (parent_category_id);
CREATE INDEX idx_categories_status ON categories (status);

CREATE TRIGGER trg_categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
