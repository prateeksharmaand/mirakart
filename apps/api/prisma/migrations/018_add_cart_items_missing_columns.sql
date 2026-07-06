-- Migration 018: add missing columns to cart_items
-- priceSnapshot was added to the Prisma schema but never backfilled in a migration,
-- causing every GET /cart to throw PrismaClientKnownRequestError 500.

DO $$
BEGIN
    -- cart_items: priceSnapshot (decimal, required — default 0 for any legacy rows)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cart_items' AND column_name = 'priceSnapshot'
    ) THEN
        ALTER TABLE "cart_items" ADD COLUMN "priceSnapshot" DECIMAL(12, 2) NOT NULL DEFAULT 0;
    END IF;
END
$$;

-- Ensure unique constraint on (cartId, variantId) matches Prisma schema @@unique
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'cart_items'
          AND constraint_name = 'cart_items_cartId_variantId_key'
          AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE "cart_items"
          ADD CONSTRAINT "cart_items_cartId_variantId_key" UNIQUE ("cartId", "variantId");
    END IF;
END
$$;
