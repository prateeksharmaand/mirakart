-- Migration 022: Seller-wise coupons
--
-- A coupon always belongs to exactly one merchant and only ever discounts
-- that merchant's own line items within a cart/order — never another
-- merchant's items, even in a cart that mixes products from multiple
-- merchants. "Deleting" a coupon just deactivates it (isActive: false);
-- there's no soft-delete column since past orders keep a durable text
-- snapshot of the code via orders.couponCode regardless of the coupon's
-- later state.

CREATE TYPE "coupon_discount_type" AS ENUM ('PERCENTAGE', 'FIXED');

CREATE TABLE IF NOT EXISTS "coupons" (
    "id"                TEXT                   NOT NULL PRIMARY KEY,
    "merchantId"        TEXT                   NOT NULL,
    "code"              TEXT                   NOT NULL UNIQUE,
    "discountType"      "coupon_discount_type" NOT NULL,
    "discountValue"     DECIMAL(12, 2)         NOT NULL,
    "maxDiscountAmount" DECIMAL(12, 2),
    "minOrderValue"     DECIMAL(12, 2),
    "usageLimit"        INTEGER,
    "perCustomerLimit"  INTEGER,
    "usedCount"         INTEGER                NOT NULL DEFAULT 0,
    "isActive"          BOOLEAN                NOT NULL DEFAULT true,
    "startsAt"          TIMESTAMPTZ,
    "expiresAt"         TIMESTAMPTZ,
    "createdAt"         TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    "updatedAt"         TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    CONSTRAINT "coupons_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "coupons_merchantId_idx" ON "coupons"("merchantId");

CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
    "id"             TEXT           NOT NULL PRIMARY KEY,
    "couponId"       TEXT           NOT NULL,
    "customerId"     TEXT           NOT NULL,
    "orderId"        TEXT           NOT NULL UNIQUE,
    "discountAmount" DECIMAL(12, 2) NOT NULL,
    "createdAt"      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT "coupon_redemptions_couponId_fkey"   FOREIGN KEY ("couponId")   REFERENCES "coupons"("id")   ON DELETE CASCADE,
    CONSTRAINT "coupon_redemptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE,
    CONSTRAINT "coupon_redemptions_orderId_fkey"    FOREIGN KEY ("orderId")    REFERENCES "orders"("id")    ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "coupon_redemptions_couponId_idx"   ON "coupon_redemptions"("couponId");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_customerId_idx" ON "coupon_redemptions"("customerId");

-- carts.appliedCouponId — the code currently applied, re-validated live on
-- every cart read (see CartService.getCart) rather than trusted as-is.
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "appliedCouponId" TEXT;
DO $$ BEGIN
  ALTER TABLE "carts" ADD CONSTRAINT "carts_appliedCouponId_fkey"
    FOREIGN KEY ("appliedCouponId") REFERENCES "coupons"("id") ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'carts appliedCouponId FK skipped: %', SQLERRM; END $$;

-- orders.couponId/couponCode — couponCode is a durable text snapshot so
-- order history keeps displaying correctly even if the coupon is later
-- deactivated. orders.discount already exists (migration 008) but has
-- never been populated until now.
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "couponId" TEXT,
  ADD COLUMN IF NOT EXISTS "couponCode" TEXT;
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'orders couponId FK skipped: %', SQLERRM; END $$;

-- order_items.discountAmount — this line's share of the order's total
-- discount; only ever non-zero for the coupon-owning merchant's items.
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0;
