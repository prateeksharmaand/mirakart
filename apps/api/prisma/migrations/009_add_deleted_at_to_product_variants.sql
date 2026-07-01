-- Migration 009: Add deletedAt column to product_variants table
-- Purpose: Support soft-delete middleware which expects deletedAt on all soft-delete tables

BEGIN;

-- Add deletedAt column to product_variants
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

COMMIT;
