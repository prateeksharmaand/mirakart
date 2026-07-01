-- Mirakart Multi-vendor ecommerce platform - Initial Schema Migration
-- This migration creates all tables, enums, and indexes for the platform
-- Generated from Prisma schema

-- ---------------------------------------------------------------------------
-- Create Enums
-- ---------------------------------------------------------------------------

CREATE TYPE admin_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE permission_action AS ENUM ('VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT');
CREATE TYPE merchant_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE merchant_document_type AS ENUM ('BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'ID_PROOF', 'BANK_DETAILS', 'OTHER');
CREATE TYPE merchant_document_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE customer_status AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
CREATE TYPE address_type AS ENUM ('SHIPPING', 'BILLING', 'BOTH');
CREATE TYPE product_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE attribute_type AS ENUM ('SELECT', 'COLOR', 'TEXT');
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE order_item_status AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');
CREATE TYPE payment_method AS ENUM ('CARD', 'UPI', 'NETBANKING', 'WALLET', 'COD');
CREATE TYPE payment_status AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');
CREATE TYPE return_status AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'AWAITING_SHIPMENT', 'ITEM_RECEIVED', 'COMPLETED', 'CANCELLED');
CREATE TYPE actor_type AS ENUM ('ADMIN', 'MERCHANT', 'CUSTOMER', 'SYSTEM');
CREATE TYPE notification_recipient_type AS ENUM ('CUSTOMER', 'MERCHANT', 'ADMIN');
CREATE TYPE banner_position AS ENUM ('HOME_HERO', 'HOME_SECONDARY', 'CATEGORY_TOP', 'STOREFRONT_TOP');

-- ---------------------------------------------------------------------------
-- Auth / RBAC Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  module VARCHAR(255) NOT NULL,
  action permission_action NOT NULL,
  description TEXT,
  CONSTRAINT permissions_module_idx UNIQUE (module)
);

CREATE INDEX IF NOT EXISTS permissions_module_idx ON permissions(module);

CREATE TABLE IF NOT EXISTS role_permissions (
  "roleId" VARCHAR(255) NOT NULL,
  "permissionId" VARCHAR(255) NOT NULL,
  PRIMARY KEY ("roleId", "permissionId"),
  CONSTRAINT role_permissions_roleId_fk FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT role_permissions_permissionId_fk FOREIGN KEY ("permissionId") REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  status admin_status NOT NULL DEFAULT 'ACTIVE',
  "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
  "roleId" VARCHAR(255),
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  CONSTRAINT admin_users_roleId_fk FOREIGN KEY ("roleId") REFERENCES roles(id)
);

CREATE INDEX IF NOT EXISTS admin_users_status_idx ON admin_users(status);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id VARCHAR(255) PRIMARY KEY,
  "tokenHash" VARCHAR(255) NOT NULL UNIQUE,
  "principalType" actor_type NOT NULL,
  "principalId" VARCHAR(255) NOT NULL,
  "userAgent" VARCHAR(255),
  "ipAddress" VARCHAR(255),
  "expiresAt" TIMESTAMP NOT NULL,
  "revokedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS refresh_tokens_principal_idx ON refresh_tokens("principalType", "principalId");

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(255) PRIMARY KEY,
  "tokenHash" VARCHAR(255) NOT NULL UNIQUE,
  "principalType" actor_type NOT NULL,
  "principalId" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "usedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_principal_idx ON password_reset_tokens("principalType", "principalId");

-- ---------------------------------------------------------------------------
-- Media Table (required before Merchant table due to FK)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS media (
  id VARCHAR(255) PRIMARY KEY,
  bucket VARCHAR(255) NOT NULL,
  "objectKey" VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  "mimeType" VARCHAR(255) NOT NULL,
  size INT NOT NULL,
  width INT,
  height INT,
  "uploadedByType" actor_type NOT NULL,
  "uploadedById" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Merchants
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS merchants (
  id VARCHAR(255) PRIMARY KEY,
  "storeName" VARCHAR(255) NOT NULL,
  "storeSlug" VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  status merchant_status NOT NULL DEFAULT 'PENDING',
  description TEXT,
  "logoMediaId" VARCHAR(255),
  "bannerMediaId" VARCHAR(255),
  "businessRegistrationNumber" VARCHAR(255),
  "taxId" VARCHAR(255),
  "commissionRate" DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  "approvedById" VARCHAR(255),
  "approvedAt" TIMESTAMP,
  "rejectionReason" TEXT,
  "addressLine1" VARCHAR(255),
  "addressLine2" VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  "postalCode" VARCHAR(255),
  country VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  CONSTRAINT merchants_logoMediaId_fk FOREIGN KEY ("logoMediaId") REFERENCES media(id),
  CONSTRAINT merchants_bannerMediaId_fk FOREIGN KEY ("bannerMediaId") REFERENCES media(id),
  CONSTRAINT merchants_approvedById_fk FOREIGN KEY ("approvedById") REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS merchants_status_idx ON merchants(status);

CREATE TABLE IF NOT EXISTS merchant_documents (
  id VARCHAR(255) PRIMARY KEY,
  "merchantId" VARCHAR(255) NOT NULL,
  type merchant_document_type NOT NULL,
  status merchant_document_status NOT NULL DEFAULT 'PENDING',
  "mediaId" VARCHAR(255) NOT NULL,
  "uploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT merchant_documents_merchantId_fk FOREIGN KEY ("merchantId") REFERENCES merchants(id) ON DELETE CASCADE,
  CONSTRAINT merchant_documents_mediaId_fk FOREIGN KEY ("mediaId") REFERENCES media(id)
);

CREATE INDEX IF NOT EXISTS merchant_documents_merchantId_idx ON merchant_documents("merchantId");

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  status customer_status NOT NULL DEFAULT 'ACTIVE',
  "emailVerifiedAt" TIMESTAMP,
  "phoneVerifiedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS customers_status_idx ON customers(status);

CREATE TABLE IF NOT EXISTS addresses (
  id VARCHAR(255) PRIMARY KEY,
  "customerId" VARCHAR(255) NOT NULL,
  label VARCHAR(255),
  "fullName" VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255),
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  "postalCode" VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  type address_type NOT NULL DEFAULT 'BOTH',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT addresses_customerId_fk FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS addresses_customerId_idx ON addresses("customerId");

-- ---------------------------------------------------------------------------
-- Catalog: Categories, Brands, Attributes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  "parentId" VARCHAR(255),
  "iconMediaId" VARCHAR(255),
  "bannerMediaId" VARCHAR(255),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  CONSTRAINT categories_parentId_fk FOREIGN KEY ("parentId") REFERENCES categories(id),
  CONSTRAINT categories_iconMediaId_fk FOREIGN KEY ("iconMediaId") REFERENCES media(id),
  CONSTRAINT categories_bannerMediaId_fk FOREIGN KEY ("bannerMediaId") REFERENCES media(id)
);

CREATE INDEX IF NOT EXISTS categories_parentId_idx ON categories("parentId");

CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  "logoMediaId" VARCHAR(255),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  CONSTRAINT brands_logoMediaId_fk FOREIGN KEY ("logoMediaId") REFERENCES media(id)
);

CREATE TABLE IF NOT EXISTS attributes (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  type attribute_type NOT NULL DEFAULT 'SELECT',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attribute_values (
  id VARCHAR(255) PRIMARY KEY,
  "attributeId" VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  "colorHex" VARCHAR(255),
  "sortOrder" INT NOT NULL DEFAULT 0,
  CONSTRAINT attribute_values_attributeId_fk FOREIGN KEY ("attributeId") REFERENCES attributes(id) ON DELETE CASCADE,
  CONSTRAINT attribute_values_unique UNIQUE ("attributeId", value)
);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  "merchantId" VARCHAR(255) NOT NULL,
  "categoryId" VARCHAR(255) NOT NULL,
  "brandId" VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  status product_status NOT NULL DEFAULT 'DRAFT',
  "rejectionReason" TEXT,
  "basePrice" DECIMAL(12, 2) NOT NULL,
  "compareAtPrice" DECIMAL(12, 2),
  sku VARCHAR(255) UNIQUE,
  barcode VARCHAR(255),
  weight DECIMAL(8, 2),
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "metaTitle" VARCHAR(255),
  "metaDescription" VARCHAR(255),
  "approvedById" VARCHAR(255),
  "approvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  CONSTRAINT products_merchantId_fk FOREIGN KEY ("merchantId") REFERENCES merchants(id),
  CONSTRAINT products_categoryId_fk FOREIGN KEY ("categoryId") REFERENCES categories(id),
  CONSTRAINT products_brandId_fk FOREIGN KEY ("brandId") REFERENCES brands(id),
  CONSTRAINT products_approvedById_fk FOREIGN KEY ("approvedById") REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS products_merchantId_idx ON products("merchantId");
CREATE INDEX IF NOT EXISTS products_categoryId_idx ON products("categoryId");
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);

CREATE TABLE IF NOT EXISTS product_attributes (
  "productId" VARCHAR(255) NOT NULL,
  "attributeId" VARCHAR(255) NOT NULL,
  PRIMARY KEY ("productId", "attributeId"),
  CONSTRAINT product_attributes_productId_fk FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT product_attributes_attributeId_fk FOREIGN KEY ("attributeId") REFERENCES attributes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(255) PRIMARY KEY,
  "productId" VARCHAR(255) NOT NULL,
  sku VARCHAR(255) NOT NULL UNIQUE,
  barcode VARCHAR(255),
  price DECIMAL(12, 2) NOT NULL,
  "compareAtPrice" DECIMAL(12, 2),
  weight DECIMAL(8, 2),
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  CONSTRAINT product_variants_productId_fk FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS product_variants_productId_idx ON product_variants("productId");

CREATE TABLE IF NOT EXISTS product_variant_attribute_values (
  "variantId" VARCHAR(255) NOT NULL,
  "attributeValueId" VARCHAR(255) NOT NULL,
  PRIMARY KEY ("variantId", "attributeValueId"),
  CONSTRAINT product_variant_attribute_values_variantId_fk FOREIGN KEY ("variantId") REFERENCES product_variants(id) ON DELETE CASCADE,
  CONSTRAINT product_variant_attribute_values_attributeValueId_fk FOREIGN KEY ("attributeValueId") REFERENCES attribute_values(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_images (
  id VARCHAR(255) PRIMARY KEY,
  "productId" VARCHAR(255) NOT NULL,
  "variantId" VARCHAR(255),
  "mediaId" VARCHAR(255) NOT NULL,
  "sortOrder" INT NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT product_images_productId_fk FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT product_images_variantId_fk FOREIGN KEY ("variantId") REFERENCES product_variants(id) ON DELETE CASCADE,
  CONSTRAINT product_images_mediaId_fk FOREIGN KEY ("mediaId") REFERENCES media(id)
);

CREATE INDEX IF NOT EXISTS product_images_productId_idx ON product_images("productId");

CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(255) PRIMARY KEY,
  "variantId" VARCHAR(255) NOT NULL UNIQUE,
  quantity INT NOT NULL DEFAULT 0,
  "reservedQuantity" INT NOT NULL DEFAULT 0,
  "lowStockThreshold" INT NOT NULL DEFAULT 5,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT inventory_variantId_fk FOREIGN KEY ("variantId") REFERENCES product_variants(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Cart
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS carts (
  id VARCHAR(255) PRIMARY KEY,
  "customerId" VARCHAR(255) NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT carts_customerId_fk FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id VARCHAR(255) PRIMARY KEY,
  "cartId" VARCHAR(255) NOT NULL,
  "variantId" VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  "priceSnapshot" DECIMAL(12, 2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cart_items_cartId_fk FOREIGN KEY ("cartId") REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT cart_items_variantId_fk FOREIGN KEY ("variantId") REFERENCES product_variants(id) ON DELETE CASCADE,
  CONSTRAINT cart_items_unique UNIQUE ("cartId", "variantId")
);

-- ---------------------------------------------------------------------------
-- Orders & Payments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  "orderNumber" VARCHAR(255) NOT NULL UNIQUE,
  "customerId" VARCHAR(255) NOT NULL,
  status order_status NOT NULL DEFAULT 'PENDING',
  subtotal DECIMAL(12, 2) NOT NULL,
  "shippingFee" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(255) NOT NULL DEFAULT 'INR',
  "shippingAddressId" VARCHAR(255) NOT NULL,
  "billingAddressId" VARCHAR(255) NOT NULL,
  "placedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  CONSTRAINT orders_customerId_fk FOREIGN KEY ("customerId") REFERENCES customers(id),
  CONSTRAINT orders_shippingAddressId_fk FOREIGN KEY ("shippingAddressId") REFERENCES addresses(id),
  CONSTRAINT orders_billingAddressId_fk FOREIGN KEY ("billingAddressId") REFERENCES addresses(id)
);

CREATE INDEX IF NOT EXISTS orders_customerId_idx ON orders("customerId");
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(255) PRIMARY KEY,
  "orderId" VARCHAR(255) NOT NULL,
  "merchantId" VARCHAR(255) NOT NULL,
  "productId" VARCHAR(255) NOT NULL,
  "variantId" VARCHAR(255) NOT NULL,
  "productNameSnapshot" VARCHAR(255) NOT NULL,
  "variantSnapshot" JSON NOT NULL,
  quantity INT NOT NULL,
  "unitPrice" DECIMAL(12, 2) NOT NULL,
  "totalPrice" DECIMAL(12, 2) NOT NULL,
  status order_item_status NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT order_items_orderId_fk FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_merchantId_fk FOREIGN KEY ("merchantId") REFERENCES merchants(id),
  CONSTRAINT order_items_productId_fk FOREIGN KEY ("productId") REFERENCES products(id),
  CONSTRAINT order_items_variantId_fk FOREIGN KEY ("variantId") REFERENCES product_variants(id)
);

CREATE INDEX IF NOT EXISTS order_items_orderId_idx ON order_items("orderId");
CREATE INDEX IF NOT EXISTS order_items_merchantId_idx ON order_items("merchantId");

CREATE TABLE IF NOT EXISTS order_status_history (
  id VARCHAR(255) PRIMARY KEY,
  "orderId" VARCHAR(255) NOT NULL,
  status order_status NOT NULL,
  note TEXT,
  "changedById" VARCHAR(255),
  "changedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT order_status_history_orderId_fk FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_status_history_changedById_fk FOREIGN KEY ("changedById") REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS order_status_history_orderId_idx ON order_status_history("orderId");

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(255) PRIMARY KEY,
  "orderId" VARCHAR(255) NOT NULL UNIQUE,
  method payment_method NOT NULL,
  provider VARCHAR(255),
  "providerPaymentId" VARCHAR(255),
  status payment_status NOT NULL DEFAULT 'PENDING',
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(255) NOT NULL DEFAULT 'INR',
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payments_orderId_fk FOREIGN KEY ("orderId") REFERENCES orders(id)
);

-- ---------------------------------------------------------------------------
-- Returns
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS return_reasons (
  id VARCHAR(255) PRIMARY KEY,
  label VARCHAR(255) NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS returns (
  id VARCHAR(255) PRIMARY KEY,
  "returnNumber" VARCHAR(255) NOT NULL UNIQUE,
  "orderId" VARCHAR(255) NOT NULL,
  "orderItemId" VARCHAR(255) NOT NULL,
  "customerId" VARCHAR(255) NOT NULL,
  "merchantId" VARCHAR(255) NOT NULL,
  "reasonId" VARCHAR(255) NOT NULL,
  "reasonDetail" TEXT,
  status return_status NOT NULL DEFAULT 'REQUESTED',
  quantity INT NOT NULL,
  "refundAmount" DECIMAL(12, 2),
  "requestedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT returns_orderId_fk FOREIGN KEY ("orderId") REFERENCES orders(id),
  CONSTRAINT returns_orderItemId_fk FOREIGN KEY ("orderItemId") REFERENCES order_items(id),
  CONSTRAINT returns_customerId_fk FOREIGN KEY ("customerId") REFERENCES customers(id),
  CONSTRAINT returns_merchantId_fk FOREIGN KEY ("merchantId") REFERENCES merchants(id),
  CONSTRAINT returns_reasonId_fk FOREIGN KEY ("reasonId") REFERENCES return_reasons(id)
);

CREATE INDEX IF NOT EXISTS returns_orderId_idx ON returns("orderId");
CREATE INDEX IF NOT EXISTS returns_merchantId_idx ON returns("merchantId");
CREATE INDEX IF NOT EXISTS returns_status_idx ON returns(status);

CREATE TABLE IF NOT EXISTS return_images (
  id VARCHAR(255) PRIMARY KEY,
  "returnId" VARCHAR(255) NOT NULL,
  "mediaId" VARCHAR(255) NOT NULL,
  "sortOrder" INT NOT NULL DEFAULT 0,
  CONSTRAINT return_images_returnId_fk FOREIGN KEY ("returnId") REFERENCES returns(id) ON DELETE CASCADE,
  CONSTRAINT return_images_mediaId_fk FOREIGN KEY ("mediaId") REFERENCES media(id)
);

CREATE INDEX IF NOT EXISTS return_images_returnId_idx ON return_images("returnId");

CREATE TABLE IF NOT EXISTS return_status_history (
  id VARCHAR(255) PRIMARY KEY,
  "returnId" VARCHAR(255) NOT NULL,
  status return_status NOT NULL,
  note TEXT,
  "changedByType" actor_type NOT NULL,
  "changedById" VARCHAR(255),
  "changedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT return_status_history_returnId_fk FOREIGN KEY ("returnId") RETURNS returns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS return_status_history_returnId_idx ON return_status_history("returnId");

-- ---------------------------------------------------------------------------
-- Notifications, Settings, Banners, Audit Log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY,
  "recipientType" notification_recipient_type NOT NULL,
  "customerId" VARCHAR(255),
  "merchantId" VARCHAR(255),
  "adminUserId" VARCHAR(255),
  type VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_customerId_fk FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT notifications_merchantId_fk FOREIGN KEY ("merchantId") REFERENCES merchants(id) ON DELETE CASCADE,
  CONSTRAINT notifications_adminUserId_fk FOREIGN KEY ("adminUserId") REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS notifications_customer_idx ON notifications("recipientType", "customerId");
CREATE INDEX IF NOT EXISTS notifications_merchant_idx ON notifications("recipientType", "merchantId");
CREATE INDEX IF NOT EXISTS notifications_admin_idx ON notifications("recipientType", "adminUserId");

CREATE TABLE IF NOT EXISTS device_tokens (
  id VARCHAR(255) PRIMARY KEY,
  token VARCHAR(255) NOT NULL UNIQUE,
  "principalType" actor_type NOT NULL,
  "principalId" VARCHAR(255) NOT NULL,
  platform VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS device_tokens_principal_idx ON device_tokens("principalType", "principalId");

CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(255) PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSON NOT NULL,
  "group" VARCHAR(255) NOT NULL,
  "updatedById" VARCHAR(255),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT settings_updatedById_fk FOREIGN KEY ("updatedById") REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS settings_group_idx ON settings("group");

CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  "mediaId" VARCHAR(255) NOT NULL,
  "linkUrl" VARCHAR(255),
  position banner_position NOT NULL,
  "sortOrder" INT NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "startAt" TIMESTAMP,
  "endAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT banners_mediaId_fk FOREIGN KEY ("mediaId") REFERENCES media(id)
);

CREATE INDEX IF NOT EXISTS banners_position_idx ON banners(position, "isActive");

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  "actorType" actor_type NOT NULL,
  "actorId" VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  "entityType" VARCHAR(255) NOT NULL,
  "entityId" VARCHAR(255) NOT NULL,
  changes JSON,
  "ipAddress" VARCHAR(255),
  "userAgent" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs("entityType", "entityId");
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs("actorType", "actorId");
