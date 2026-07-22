-- Migration 021: Product IDs, SUSPENDED product status, READY_TO_SHIP order step
--
-- PART A adds new enum values (own transaction — Postgres won't let a value
-- added by ALTER TYPE be referenced by a statement in the same transaction,
-- and nothing here needs to reference them anyway, but this keeps the same
-- conservative separation migration 020 used).
--
-- PART B adds Brand.code and Product.productCode, backfills existing rows
-- with generated codes (format <BRANDCODE>-000001, PRD-000001 with no
-- brand), and enforces uniqueness — mirrors how migration 020 backfilled
-- orders.orderNumber for pre-existing rows.

BEGIN;

ALTER TYPE product_status ADD VALUE IF NOT EXISTS 'SUSPENDED';

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'READY_TO_SHIP';
ALTER TYPE order_item_status ADD VALUE IF NOT EXISTS 'READY_TO_SHIP';

COMMIT;

BEGIN;

-- brands.code — short unique code used as the Product ID prefix.
ALTER TABLE brands ADD COLUMN IF NOT EXISTS "code" VARCHAR(255);

WITH base AS (
  SELECT id, "createdAt",
         NULLIF(LEFT(regexp_replace(upper(name), '[^A-Z0-9]', '', 'g'), 8), '') AS base_code
  FROM brands
  WHERE "code" IS NULL
),
numbered AS (
  SELECT id, "createdAt",
         COALESCE(base_code, 'BRAND') AS base_code,
         ROW_NUMBER() OVER (PARTITION BY COALESCE(base_code, 'BRAND') ORDER BY "createdAt") AS rn
  FROM base
)
UPDATE brands b
SET "code" = n.base_code || CASE WHEN n.rn = 1 THEN '' ELSE n.rn::text END
FROM numbered n
WHERE b.id = n.id;

CREATE UNIQUE INDEX IF NOT EXISTS "brands_code_key" ON brands("code");

-- products.productCode — permanent, human-readable Product ID.
ALTER TABLE products ADD COLUMN IF NOT EXISTS "productCode" VARCHAR(255);

WITH numbered AS (
  SELECT p.id,
         COALESCE(b."code", 'PRD') AS prefix,
         ROW_NUMBER() OVER (PARTITION BY COALESCE(b."code", 'PRD') ORDER BY p."createdAt") AS rn
  FROM products p
  LEFT JOIN brands b ON b.id = p."brandId"
  WHERE p."productCode" IS NULL
)
UPDATE products p
SET "productCode" = n.prefix || '-' || LPAD(n.rn::text, 6, '0')
FROM numbered n
WHERE p.id = n.id;

DO $$ BEGIN
  ALTER TABLE products ALTER COLUMN "productCode" SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'products.productCode NOT NULL skipped: %', SQLERRM;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "products_productCode_key" ON products("productCode");

COMMIT;
