-- Migration 023: Fix order_items.discountAmount left nullable
--
-- Migration 022's `ADD COLUMN IF NOT EXISTS "discountAmount" ... NOT NULL
-- DEFAULT 0` is a no-op when the column already exists, regardless of
-- whether it matches that NOT NULL/DEFAULT spec — on this database the
-- column existed already (nullable, no default), which the previous
-- migration silently left as-is, populated with NULLs. Prisma requires
-- Decimal columns declared non-nullable in schema.prisma to genuinely be
-- NOT NULL, so any query selecting order_items (customer/merchant/admin
-- order lists and details) failed with a PrismaClientKnownRequestError.

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(12, 2) DEFAULT 0;
UPDATE "order_items" SET "discountAmount" = 0 WHERE "discountAmount" IS NULL;
DO $$ BEGIN
  ALTER TABLE "order_items" ALTER COLUMN "discountAmount" SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'order_items.discountAmount NOT NULL skipped: %', SQLERRM;
END $$;
ALTER TABLE "order_items" ALTER COLUMN "discountAmount" SET DEFAULT 0;
