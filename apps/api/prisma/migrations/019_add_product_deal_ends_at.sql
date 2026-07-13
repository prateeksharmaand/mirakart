-- Migration 019: add dealEndsAt column to products
-- Backs the homepage "Deals" countdown feature -- a product with a future
-- dealEndsAt is treated as an active time-limited deal.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'dealEndsAt'
    ) THEN
        ALTER TABLE "products" ADD COLUMN "dealEndsAt" TIMESTAMP(3);
    END IF;
END
$$;
