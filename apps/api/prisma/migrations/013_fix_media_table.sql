-- Migration 013: fix media table column mismatch
-- Initial SQL had: bucketKey, contentType, size (nullable)
-- Prisma schema expects: bucket, objectKey, url, mimeType, size (NOT NULL),
--   width (nullable), height (nullable), uploadedByType, uploadedById (nullable)

DO $$
BEGIN
    -- bucket (separate from objectKey)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'media' AND column_name = 'bucket'
    ) THEN
        ALTER TABLE "media" ADD COLUMN "bucket" VARCHAR(255) NOT NULL DEFAULT '';
    END IF;

    -- objectKey (replaces/mirrors old bucketKey)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'media' AND column_name = 'objectKey'
    ) THEN
        ALTER TABLE "media" ADD COLUMN "objectKey" VARCHAR(255) NOT NULL DEFAULT '';
        -- migrate data from old column if it exists and table has rows
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'media' AND column_name = 'bucketKey'
        ) THEN
            UPDATE "media" SET "objectKey" = "bucketKey";
        END IF;
    END IF;

    -- url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'media' AND column_name = 'url'
    ) THEN
        ALTER TABLE "media" ADD COLUMN "url" TEXT NOT NULL DEFAULT '';
    END IF;

    -- mimeType (replaces old contentType)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'media' AND column_name = 'mimeType'
    ) THEN
        ALTER TABLE "media" ADD COLUMN "mimeType" VARCHAR(255) NOT NULL DEFAULT 'application/octet-stream';
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'media' AND column_name = 'contentType'
        ) THEN
            UPDATE "media" SET "mimeType" = COALESCE("contentType", 'application/octet-stream');
        END IF;
    END IF;

    -- size: make NOT NULL (Prisma schema has Int, not Int?)
    UPDATE "media" SET "size" = 0 WHERE "size" IS NULL;
    BEGIN
        ALTER TABLE "media" ALTER COLUMN "size" SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- width (nullable)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'media' AND column_name = 'width'
    ) THEN
        ALTER TABLE "media" ADD COLUMN "width" INT;
    END IF;

    -- height (nullable)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'media' AND column_name = 'height'
    ) THEN
        ALTER TABLE "media" ADD COLUMN "height" INT;
    END IF;

    -- uploadedByType
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'media' AND column_name = 'uploadedByType'
    ) THEN
        ALTER TABLE "media" ADD COLUMN "uploadedByType" "ActorType" NOT NULL DEFAULT 'MERCHANT';
    END IF;

    -- uploadedById (nullable)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'media' AND column_name = 'uploadedById'
    ) THEN
        ALTER TABLE "media" ADD COLUMN "uploadedById" VARCHAR(255);
    END IF;
END
$$;
