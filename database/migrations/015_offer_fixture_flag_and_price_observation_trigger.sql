-- 015_offer_fixture_flag_and_price_observation_trigger.sql
-- Phase 1 (Core Shopping Intelligence), commit 4.
--
-- 1. offers.is_fixture: marks mock/test/sample offers so they are never
--    presented as real live merchant pricing. Real offers default to FALSE.
--
-- 2. Price observation recording, done in the database so EVERY writer
--    (API, seeds, future feed importers for Amazon/Walmart/eBay...) is
--    covered and provider-agnostic:
--      - on INSERT of an offer: record its first observation
--      - on UPDATE where price or currency actually changed: record a new one
--    In both cases nothing is recorded if the most recent observation for
--    that offer already has the same price and currency (no duplicates).
--    Observations inherit offers.is_fixture, so fixture pricing stays
--    separate from real pricing in product_price_history.
--
-- Existing offers get no back-filled history (past prices are unknown and
-- must not be invented); their first observation is recorded the next
-- time their price changes.
--
-- Idempotent: IF NOT EXISTS / CREATE OR REPLACE / DROP TRIGGER IF EXISTS.

ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS is_fixture BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION record_offer_price_observation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_price_history (
    product_id, merchant_id, market_id, offer_id,
    price, currency, source, is_fixture
  )
  SELECT
    NEW.product_id, NEW.merchant_id, NEW.market_id, NEW.offer_id,
    NEW.price, NEW.currency,
    CASE WHEN NEW.is_fixture THEN 'fixture' ELSE 'offer_update' END,
    NEW.is_fixture
  WHERE NOT EXISTS (
    SELECT 1
    FROM (
      SELECT h.price, h.currency
      FROM product_price_history h
      WHERE h.offer_id = NEW.offer_id
      ORDER BY h.observed_at DESC, h.created_at DESC
      LIMIT 1
    ) latest
    WHERE latest.price = NEW.price AND latest.currency = NEW.currency
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_offers_record_price_observation_insert ON offers;
CREATE TRIGGER trg_offers_record_price_observation_insert
AFTER INSERT ON offers
FOR EACH ROW EXECUTE FUNCTION record_offer_price_observation();

DROP TRIGGER IF EXISTS trg_offers_record_price_observation_update ON offers;
CREATE TRIGGER trg_offers_record_price_observation_update
AFTER UPDATE OF price, currency ON offers
FOR EACH ROW
WHEN (
  OLD.price IS DISTINCT FROM NEW.price
  OR OLD.currency IS DISTINCT FROM NEW.currency
)
EXECUTE FUNCTION record_offer_price_observation();
