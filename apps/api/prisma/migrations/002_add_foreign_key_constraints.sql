-- Migration 002: Add missing foreign-key constraints
-- Purpose: Enforce referential integrity at the database level
-- Safety: Uses RESTRICT initially (prevent deletion of referenced entities)
--         Can be updated to CASCADE in future migrations if business logic allows
-- Author: Phase 2 remediation

BEGIN;

-- Step 1: Add FK constraints for Merchant → Product/OrderItem
-- Note: These prevent accidental merchant deletion; business decision required
--       if merchants should cascade-delete or soft-delete their data

ALTER TABLE products
ADD CONSTRAINT fk_products_merchant_id
FOREIGN KEY ("merchantId") REFERENCES merchants("id")
  ON DELETE RESTRICT;

ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_merchant_id
FOREIGN KEY ("merchantId") REFERENCES merchants("id")
  ON DELETE RESTRICT;

-- Step 2: Add FK constraints for ProductVariant → OrderItem
-- Orders should be immutable; prevent variant deletion of ordered items

ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_variant_id
FOREIGN KEY ("variantId") REFERENCES product_variants("id")
  ON DELETE RESTRICT;

-- Step 3: Add FK constraint for Product → OrderItem
-- Ensures product exists (may be soft-deleted but FK should still work)

ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_product_id
FOREIGN KEY ("productId") REFERENCES products("id")
  ON DELETE RESTRICT;

-- Step 4: Add FK for Customer → Order (already exists via customerId, but verify)
-- Orders should survive customer deletion (customer can be soft-deleted)

ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer_id
FOREIGN KEY ("customerId") REFERENCES customers("id")
  ON DELETE RESTRICT;

-- Step 5: Add FK for Order → Address (prevent address deletion of ordered shipments)

ALTER TABLE orders
ADD CONSTRAINT fk_orders_shipping_address_id
FOREIGN KEY ("shippingAddressId") REFERENCES addresses("id")
  ON DELETE RESTRICT;

ALTER TABLE orders
ADD CONSTRAINT fk_orders_billing_address_id
FOREIGN KEY ("billingAddressId") REFERENCES addresses("id")
  ON DELETE RESTRICT;

-- Step 6: Add FK for Return → Product (prevent product deletion of returned items)

ALTER TABLE returns
ADD CONSTRAINT fk_returns_product_item_id
FOREIGN KEY ("orderItemId") REFERENCES order_items("id")
  ON DELETE RESTRICT;

COMMIT;
