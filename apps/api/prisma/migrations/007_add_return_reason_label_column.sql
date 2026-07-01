-- Migration 007: Add missing sortOrder column to return_reasons table
-- Purpose: Align database schema with Prisma schema definition
-- Schema drift issue: Prisma schema expects sortOrder column but database doesn't have it

BEGIN;

-- Add sortOrder column if missing
ALTER TABLE return_reasons
ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0;

COMMIT;
