-- Migration 007: Add missing label column to return_reasons table
-- Purpose: Align database schema with Prisma schema definition
-- Schema drift issue: Prisma schema expects label column but database doesn't have it

BEGIN;

-- Add label column to return_reasons table
ALTER TABLE return_reasons
ADD COLUMN IF NOT EXISTS "label" VARCHAR(255) UNIQUE;

-- Add isActive column if missing
ALTER TABLE return_reasons
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Add sortOrder column if missing
ALTER TABLE return_reasons
ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0;

COMMIT;
