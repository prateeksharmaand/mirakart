-- Migration: add product tags
-- Creates tags table and product_tags pivot table

CREATE TABLE IF NOT EXISTS "tags" (
    "id"          TEXT        NOT NULL,
    "name"        TEXT        NOT NULL,
    "slug"        TEXT        NOT NULL,
    "description" TEXT,
    "isActive"    BOOLEAN     NOT NULL DEFAULT true,
    "sortOrder"   INTEGER     NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"   TIMESTAMP(3),

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tags_slug_key" ON "tags"("slug");
CREATE INDEX IF NOT EXISTS "tags_isActive_idx" ON "tags"("isActive");

CREATE TABLE IF NOT EXISTS "product_tags" (
    "productId" TEXT NOT NULL,
    "tagId"     TEXT NOT NULL,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("productId", "tagId")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'product_tags_productId_fkey'
    ) THEN
        ALTER TABLE "product_tags"
            ADD CONSTRAINT "product_tags_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'product_tags_tagId_fkey'
    ) THEN
        ALTER TABLE "product_tags"
            ADD CONSTRAINT "product_tags_tagId_fkey"
            FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
