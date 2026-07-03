-- Migration: add isPrimary column to product_images and backfill

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_images' AND column_name = 'isPrimary'
    ) THEN
        ALTER TABLE "product_images" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;

        -- Backfill: for each product, set isPrimary = true on the image with the lowest sortOrder
        UPDATE "product_images" pi
        SET "isPrimary" = true
        WHERE pi.id IN (
            SELECT DISTINCT ON ("productId") id
            FROM "product_images"
            ORDER BY "productId", "sortOrder" ASC, "id" ASC
        );
    END IF;
END
$$;
