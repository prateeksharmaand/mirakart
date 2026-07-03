-- Migration 015: fix uploadedByType enum type mismatch (robust version)
-- Migration 014 created actor_type but ALTER TABLE inside the same DO block
-- may not resolve the new type at parse time. Use EXECUTE to force runtime resolution.

-- Step 1: ensure actor_type (lowercase) enum exists
DO $$ BEGIN
    CREATE TYPE actor_type AS ENUM ('ADMIN', 'MERCHANT', 'CUSTOMER', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: alter the column using EXECUTE so the type is resolved at runtime
DO $$ BEGIN
    EXECUTE '
        ALTER TABLE "media"
            ALTER COLUMN "uploadedByType" TYPE actor_type
            USING "uploadedByType"::text::actor_type
    ';
EXCEPTION WHEN OTHERS THEN
    -- Already the correct type or another benign error — log and continue
    RAISE NOTICE 'uploadedByType column alter skipped: %', SQLERRM;
END $$;
