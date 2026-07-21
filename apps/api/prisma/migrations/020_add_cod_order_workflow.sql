-- Migration 020: Cash-on-Delivery order workflow
--
-- PART A fixes pre-existing schema drift between this file's earlier
-- migrations and the Prisma schema that discovering this feature's own
-- checkout path uncovered: `orders.orderNumber`, `order_status_history`'s
-- status/note/changedAt columns, and several `payments` columns were never
-- actually added to the database despite schema.prisma expecting them since
-- migration 008/004. Every order-creation transaction (COD or online) writes
-- to all of these in one go, so this alone very likely explains the
-- checkout 500 seen in production before this migration is applied.
--
-- PART B adds the new order/payment statuses and columns needed for the
-- COD confirm -> accept -> fulfill -> deliver -> collect-payment workflow.

BEGIN;

-- ============================================================
-- PART A: pre-existing drift fixes
-- ============================================================

-- orders.orderNumber (unique, required — migration 003 already tried to
-- index a column that was never created)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "orderNumber" VARCHAR(255);
UPDATE orders SET "orderNumber" = 'ORD-LEGACY-' || id WHERE "orderNumber" IS NULL;
DO $$ BEGIN
  ALTER TABLE orders ALTER COLUMN "orderNumber" SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'orders.orderNumber NOT NULL skipped: %', SQLERRM;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS orders_orderNumber_key ON orders("orderNumber");

-- orders.totalAmount: legacy NOT NULL column with no default, superseded by
-- `total` (added in migration 008) — current code never writes to it.
ALTER TABLE orders ALTER COLUMN "totalAmount" DROP NOT NULL;

-- order_status_history: current app code writes status/note/changedAt;
-- the live table only ever had fromStatus/toStatus/notes/createdAt.
-- toStatus is legacy NOT NULL with no default — same relaxation as above.
ALTER TABLE order_status_history
  ADD COLUMN IF NOT EXISTS "status" "OrderStatus",
  ADD COLUMN IF NOT EXISTS "note" TEXT,
  ADD COLUMN IF NOT EXISTS "changedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE order_status_history ALTER COLUMN "toStatus" DROP NOT NULL;
UPDATE order_status_history SET "status" = "toStatus" WHERE "status" IS NULL AND "toStatus" IS NOT NULL;
UPDATE order_status_history SET "note" = "notes" WHERE "note" IS NULL;
UPDATE order_status_history SET "changedAt" = "createdAt" WHERE "changedAt" IS NULL;

-- payments: provider/providerPaymentId (Razorpay), currency (has a Prisma
-- default so it's included on every insert), paidAt.
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS "provider" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "providerPaymentId" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP;
UPDATE payments SET "providerPaymentId" = "transactionId"
  WHERE "providerPaymentId" IS NULL AND "transactionId" IS NOT NULL;

-- notifications: the live table only ever had a generic recipientId; the
-- app has since moved to per-recipient-type FK columns plus a `type` tag
-- (this feature is the first to actually exercise admin/merchant
-- notifications at volume, which is what surfaced the gap).
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS "type" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "customerId" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "merchantId" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "adminUserId" VARCHAR(255);
UPDATE notifications SET "type" = 'LEGACY' WHERE "type" IS NULL;
UPDATE notifications SET "customerId" = "recipientId" WHERE "recipientType" = 'CUSTOMER' AND "customerId" IS NULL;
UPDATE notifications SET "merchantId" = "recipientId" WHERE "recipientType" = 'MERCHANT' AND "merchantId" IS NULL;
UPDATE notifications SET "adminUserId" = "recipientId" WHERE "recipientType" = 'ADMIN' AND "adminUserId" IS NULL;
-- recipientId is legacy NOT NULL with no default; current code populates
-- the per-type FK columns above instead, so it's never written going forward.
ALTER TABLE notifications ALTER COLUMN "recipientId" DROP NOT NULL;
DO $$ BEGIN
  ALTER TABLE notifications ALTER COLUMN "type" SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'notifications.type NOT NULL skipped: %', SQLERRM;
END $$;
DO $$ BEGIN
  ALTER TABLE notifications ADD CONSTRAINT notifications_customerId_fkey
    FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'notifications customerId FK skipped: %', SQLERRM; END $$;
DO $$ BEGIN
  ALTER TABLE notifications ADD CONSTRAINT notifications_merchantId_fkey
    FOREIGN KEY ("merchantId") REFERENCES merchants(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'notifications merchantId FK skipped: %', SQLERRM; END $$;
DO $$ BEGIN
  ALTER TABLE notifications ADD CONSTRAINT notifications_adminUserId_fkey
    FOREIGN KEY ("adminUserId") REFERENCES admin_users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'notifications adminUserId FK skipped: %', SQLERRM; END $$;

-- order_status_history.changedById was FK-constrained to admin_users only;
-- merchants/customers/system now also drive transitions, so this becomes a
-- polymorphic reference (same no-DB-FK pattern already used by
-- return_status_history.changedById), and gets a changedByType column.
DO $$ BEGIN
  ALTER TABLE order_status_history DROP CONSTRAINT "order_status_history_changedById_fkey";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'order_status_history changedById FK drop skipped: %', SQLERRM;
END $$;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS "changedByType" actor_type;

-- ============================================================
-- PART B: COD workflow — new enum values (idempotent, PG12+)
-- ============================================================

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_CONFIRMATION';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'FAILED_DELIVERY';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COD_REFUSED';

ALTER TYPE "OrderItemStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "OrderItemStatus" ADD VALUE IF NOT EXISTS 'PACKED';
ALTER TYPE "OrderItemStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';
ALTER TYPE "OrderItemStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "OrderItemStatus" ADD VALUE IF NOT EXISTS 'FAILED_DELIVERY';
ALTER TYPE "OrderItemStatus" ADD VALUE IF NOT EXISTS 'COD_REFUSED';

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'UNPAID';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PAID';

COMMIT;

-- New columns below run in a second transaction: enum values added above
-- are not visible to statements in the same transaction that use them
-- (Postgres restriction on ALTER TYPE ... ADD VALUE), and orders.status /
-- payments.status defaults don't reference the new values anyway, but we
-- keep this separate to be safe.
BEGIN;

-- orders: cancellation + rejection metadata
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelReason" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelledByType" actor_type,
  ADD COLUMN IF NOT EXISTS "cancelledById" VARCHAR(255);

-- payments: manual COD-collection metadata (Received Date reuses paidAt,
-- Received By is collectedByAdminId, Remarks is collectionNote)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS "collectedByAdminId" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "collectionNote" TEXT,
  ADD COLUMN IF NOT EXISTS "amountReceived" DECIMAL(12, 2);

COMMIT;
