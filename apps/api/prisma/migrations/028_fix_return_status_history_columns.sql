-- Same pre-existing schema drift already fixed for order_status_history in
-- migration 020 (PART A), but never applied for its return-side counterpart:
-- return_status_history has only ever had fromStatus/toStatus/notes/createdAt
-- in production, while the app (returns.repository.ts) writes
-- status/note/changedByType/changedById/changedAt — none of which have ever
-- existed on this table. Every return.create() call fails on this the moment
-- it gets past return_images (see migration 027).
BEGIN;

ALTER TABLE return_status_history
  ADD COLUMN IF NOT EXISTS "status" return_status,
  ADD COLUMN IF NOT EXISTS "note" TEXT,
  ADD COLUMN IF NOT EXISTS "changedById" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "changedByType" actor_type,
  ADD COLUMN IF NOT EXISTS "changedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- toStatus is legacy NOT NULL with no default and the app never writes it —
-- same relaxation as order_status_history's toStatus in migration 020.
ALTER TABLE return_status_history ALTER COLUMN "toStatus" DROP NOT NULL;

UPDATE return_status_history SET "status" = "toStatus" WHERE "status" IS NULL AND "toStatus" IS NOT NULL;
UPDATE return_status_history SET "note" = "notes" WHERE "note" IS NULL;
UPDATE return_status_history SET "changedAt" = "createdAt" WHERE "changedAt" IS NULL;

COMMIT;
