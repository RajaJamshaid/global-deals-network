-- 001_usa_amazon.sql
-- Stage 1B seed: USA market, Amazon merchant, a small starter
-- category set, and an Amazon affiliate program placeholder.
--
-- No credentials, API keys, or affiliate tags are inserted here -
-- those stay in environment variables (AMAZON_AFFILIATE_TAG,
-- AMAZON_API_KEY, AMAZON_API_SECRET in .env.example) and will be used
-- by link-generation logic in a later stage, never stored in this
-- table. commission_value is left NULL and status is 'pending' since
-- the program isn't actually connected/approved yet - this is a
-- structural placeholder, not real program data.
--
-- Idempotent: every INSERT uses ON CONFLICT DO NOTHING against the
-- relevant unique constraint, so this file is safe to run against an
-- already-seeded database.

INSERT INTO markets (code, name, currency, language, timezone, status)
VALUES ('US', 'United States', 'USD', 'en', 'America/New_York', 'active')
ON CONFLICT (code) DO NOTHING;

INSERT INTO merchants (name, slug, website_url, merchant_type, affiliate_status, merchant_status)
VALUES ('Amazon', 'amazon', 'https://www.amazon.com', 'marketplace', 'pending', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, status)
VALUES
  ('Electronics', 'electronics', 'Electronics and tech deals.', 'active'),
  ('Home & Kitchen', 'home-kitchen', 'Home and kitchen deals.', 'active'),
  ('Fashion', 'fashion', 'Clothing, shoes and accessories deals.', 'active'),
  ('Health & Beauty', 'health-beauty', 'Health, beauty and personal care deals.', 'active'),
  ('Toys & Games', 'toys-games', 'Toys, games and hobby deals.', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO affiliate_programs (
  merchant_id, network_name, program_name, commission_type,
  commission_value, cookie_duration_days, status
)
SELECT
  merchant_id,
  'amazon_associates',
  'Amazon Associates',
  'percentage',
  NULL,
  1,
  'pending'
FROM merchants
WHERE slug = 'amazon'
ON CONFLICT (merchant_id, network_name) DO NOTHING;
