-- 011_create_users.sql
-- Per docs/architecture/GDN_User_Preference_Architecture.md section 3
-- (User Identity) and section 42 (User API): the minimal real slice
-- of the centralized User & Preference Engine needed for Stage 1E
-- (Telegram Bot). Deliberately NOT a Telegram-only table - the same
-- users table is meant to serve the future Web app, Mini App, and
-- WhatsApp, via provider-specific rows in user_identities (012).
--
-- Only one concrete preference column (preferred_market_id) is added
-- now, since it's the only preference Stage 1E's bot commands
-- actually need. The fuller generic user_preferences/favorites/
-- wishlist tables described in that architecture doc are bigger,
-- cross-channel future scope and are not created here - this table
-- does not block adding them later.

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  preferred_market_id UUID REFERENCES markets (market_id) ON DELETE SET NULL,
  language TEXT,
  currency TEXT,
  timezone TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ,
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX idx_users_preferred_market_id ON users (preferred_market_id);
CREATE INDEX idx_users_status ON users (status);

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
