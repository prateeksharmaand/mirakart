-- Migration 008: Add missing columns to orders and order_items tables
-- Purpose: Align database schema with Prisma schema definition
-- Schema drift issue: Prisma expects columns that database is missing

BEGIN;

-- Add missing columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "shippingFee" DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "tax" DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "discount" DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total" DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS "shippingAddressId" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "billingAddressId" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "placedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to order_items table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS "productNameSnapshot" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "variantSnapshot" JSONB,
ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalPrice" DECIMAL(12, 2) DEFAULT 0;

COMMIT;
