-- Migration 012: add missing columns to product_variants and inventory
-- These columns exist in the Prisma schema but were absent from the initial SQL migration,
-- causing every variant creation / inventory upsert to throw a 500.

DO $$
BEGIN
    -- product_variants: weight (nullable decimal)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_variants' AND column_name = 'weight'
    ) THEN
        ALTER TABLE "product_variants" ADD COLUMN "weight" DECIMAL(8, 2);
    END IF;

    -- product_variants: isDefault (boolean, default false)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_variants' AND column_name = 'isDefault'
    ) THEN
        ALTER TABLE "product_variants" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- inventory: lowStockThreshold (int, default 5)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory' AND column_name = 'lowStockThreshold'
    ) THEN
        ALTER TABLE "inventory" ADD COLUMN "lowStockThreshold" INT NOT NULL DEFAULT 5;
    END IF;
END
$$;

-- Ensure product_variants.sku has a UNIQUE constraint (Prisma schema marks it @unique)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'product_variants'
          AND constraint_name = 'product_variants_sku_key'
          AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_sku_key" UNIQUE ("sku");
    END IF;
END
$$;
