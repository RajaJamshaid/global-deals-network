-- 012_create_user_identities.sql
-- Per docs/architecture/GDN_User_Preference_Architecture.md section 4
-- (External Identities): maps an external platform identity (e.g. a
-- Telegram user_id) to one internal GDN user. The internal user_id
-- (011) remains the primary identity - provider_user_id is never used
-- as a replacement for it. The same table structure is meant to
-- later hold 'whatsapp', 'web', 'email', etc. rows for the same
-- users - not Telegram-specific.

CREATE TABLE user_identities (
  identity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_identities_provider_unique UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_user_identities_user_id ON user_identities (user_id);
