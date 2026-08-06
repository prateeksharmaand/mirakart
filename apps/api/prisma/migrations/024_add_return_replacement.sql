-- Migration 024: Return resolution type (Refund vs Replacement)
--
-- Adds a second resolution a customer can request alongside the existing
-- refund flow: replace with a different variant of the same product (or
-- the same variant, for defective-item replacements). Both new columns are
-- fresh — never existed before — so a plain guarded ADD COLUMN is safe
-- here, unlike the pre-existing-column drift migration 023 had to fix.

CREATE TYPE "return_resolution_type" AS ENUM ('REFUND', 'REPLACEMENT');

ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "resolutionType" "return_resolution_type" NOT NULL DEFAULT 'REFUND';
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "replacementVariantId" TEXT;
DO $$ BEGIN
  ALTER TABLE "returns" ADD CONSTRAINT "returns_replacementVariantId_fkey"
    FOREIGN KEY ("replacementVariantId") REFERENCES "product_variants"("id") ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'returns replacementVariantId FK skipped: %', SQLERRM; END $$;
