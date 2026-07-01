-- Migration 006: Add missing linkUrl column to banners table
-- Purpose: Align database schema with Prisma schema definition
-- Schema drift issue: Prisma schema expects linkUrl column but database doesn't have it

BEGIN;

-- Add linkUrl column to banners table
ALTER TABLE banners
ADD COLUMN IF NOT EXISTS "linkUrl" VARCHAR(500);

COMMIT;
