-- 016_create_product_barcodes.sql
-- Phase 1, Commit 7: barcode -> canonical product mapping.
--
-- A barcode (UPC-A, EAN-8, EAN-13 or GTIN-14) identifies one canonical GDN
-- product, never a merchant listing, so barcode search can converge on the
-- same product + comparison pipeline as text and image search. The
-- products table has no barcode column; this table is the mapping.
--
-- gtin is stored normalised to 14 digits (shorter codes are left-padded
-- with zeros), so a UPC-A and the matching EAN-13 resolve to the same row.
-- One GTIN maps to exactly one product. Nothing is ever invented from a
-- barcode: a product is only found if a row exists here.
--
-- Additive and idempotent (IF NOT EXISTS). Not applied to production by
-- this commit.

CREATE TABLE IF NOT EXISTS product_barcodes (
  barcode_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  gtin TEXT NOT NULL CHECK (gtin ~ '^[0-9]{14}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_barcodes_gtin_unique UNIQUE (gtin)
);

CREATE INDEX IF NOT EXISTS idx_product_barcodes_product_id
  ON product_barcodes (product_id);
