-- 001_enable_extensions.sql
-- Enables gen_random_uuid(), used as the default for every primary key
-- per docs/architecture/GDN_Database_Implementation_Architecture.md
-- ("ID Strategy: Use UUID or equivalent globally unique identifiers").

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared trigger function so every table with an updated_at column
-- keeps it current automatically, instead of relying on application
-- code discipline in every write path.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
