-- Migration 016: add missing columns to banners table
-- Prisma schema expects startAt, endAt, sortOrder, isActive but initial SQL lacked them.

ALTER TABLE "banners"
    ADD COLUMN IF NOT EXISTS "sortOrder"  INT       NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "isActive"   BOOLEAN   NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "startAt"    TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "endAt"      TIMESTAMP;
