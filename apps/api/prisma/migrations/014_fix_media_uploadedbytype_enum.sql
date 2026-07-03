-- Migration 014: fix uploadedByType column enum type mismatch
-- Prisma 5.x generates queries using lowercase "actor_type" enum,
-- but migration 013 added the column with the camelCase "ActorType" enum.
-- Fix: ensure actor_type (lowercase) enum exists and switch the column to use it.

DO $$
BEGIN
    -- Create actor_type (lowercase) if it doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'actor_type') THEN
        CREATE TYPE actor_type AS ENUM ('ADMIN', 'MERCHANT', 'CUSTOMER', 'SYSTEM');
    END IF;

    -- Switch the column from "ActorType" to actor_type
    -- Cast chain: enum → text → target enum (safe because values are identical)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'media' AND column_name = 'uploadedByType'
    ) THEN
        ALTER TABLE "media"
            ALTER COLUMN "uploadedByType" TYPE actor_type
            USING "uploadedByType"::text::actor_type;
    END IF;
END
$$;
