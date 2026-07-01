-- Migration 001.5: Add missing columns from Prisma schema
-- Purpose: Align database schema with Prisma schema definitions
-- These columns were defined in Prisma but missing from initial migration

BEGIN;

-- Add missing columns to returns table
ALTER TABLE returns
ADD COLUMN IF NOT EXISTS "returnNumber" VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS "orderItemId" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "quantity" INTEGER,
ADD COLUMN IF NOT EXISTS "reasonDetail" TEXT,
ADD COLUMN IF NOT EXISTS "requestedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP;

-- Add missing column to return_status_history
ALTER TABLE return_status_history
ADD COLUMN IF NOT EXISTS "changedByType" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "changedById" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "note" TEXT;

COMMIT;
