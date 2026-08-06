-- Migration 025: Dispatch & Shipment Management
--
-- Adds dispatch/shipment capture to order_items, populated once a merchant
-- marks their items PACKED and dispatches (see OrdersService.dispatchOrder).
-- Deliberately flat columns on order_items rather than a new table — a
-- merchant's view of an order is already just their own order_items rows
-- filtered by merchantId everywhere else in this module, so shipment data
-- (also per-merchant-per-order) fits the same shape. courierPartner /
-- trackingNumber are plain strings so a future courier API integration can
-- populate them the same way manual entry does today, with no schema change.

CREATE TYPE "dispatch_method" AS ENUM ('COURIER', 'SELF_DELIVERY');

ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "dispatchMethod"       "dispatch_method",
  ADD COLUMN IF NOT EXISTS "courierPartner"       TEXT,
  ADD COLUMN IF NOT EXISTS "customCourierName"    TEXT,
  ADD COLUMN IF NOT EXISTS "trackingNumber"       TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryPersonName"   TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryPersonPhone"  TEXT,
  ADD COLUMN IF NOT EXISTS "vehicleNumber"        TEXT,
  ADD COLUMN IF NOT EXISTS "dispatchDate"         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "expectedDeliveryDate" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "deliveredAt"          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "shipmentNotes"        TEXT;

CREATE INDEX IF NOT EXISTS "order_items_trackingNumber_idx" ON "order_items"("trackingNumber");
