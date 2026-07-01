-- Create enums
CREATE TYPE IF NOT EXISTS admin_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE IF NOT EXISTS permission_action AS ENUM ('VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT');
CREATE TYPE IF NOT EXISTS merchant_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE IF NOT EXISTS merchant_document_type AS ENUM ('BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'ID_PROOF', 'BANK_DETAILS', 'OTHER');
CREATE TYPE IF NOT EXISTS merchant_document_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE IF NOT EXISTS customer_status AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
CREATE TYPE IF NOT EXISTS address_type AS ENUM ('SHIPPING', 'BILLING', 'BOTH');
CREATE TYPE IF NOT EXISTS product_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE IF NOT EXISTS attribute_type AS ENUM ('SELECT', 'COLOR', 'TEXT');
CREATE TYPE IF NOT EXISTS order_status AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE IF NOT EXISTS order_item_status AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');
CREATE TYPE IF NOT EXISTS payment_method AS ENUM ('CARD', 'UPI', 'NETBANKING', 'WALLET', 'COD');
CREATE TYPE IF NOT EXISTS payment_status AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');
CREATE TYPE IF NOT EXISTS return_status AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'AWAITING_SHIPMENT', 'ITEM_RECEIVED', 'COMPLETED', 'CANCELLED');
CREATE TYPE IF NOT EXISTS actor_type AS ENUM ('ADMIN', 'MERCHANT', 'CUSTOMER', 'SYSTEM');
CREATE TYPE IF NOT EXISTS notification_recipient_type AS ENUM ('CUSTOMER', 'MERCHANT', 'ADMIN');
CREATE TYPE IF NOT EXISTS banner_position AS ENUM ('HOME_HERO', 'HOME_SECONDARY', 'CATEGORY_TOP', 'STOREFRONT_TOP');

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "description" TEXT,
  "isSystem" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
  "id" VARCHAR(255) PRIMARY KEY,
  "code" VARCHAR(255) NOT NULL UNIQUE,
  "module" VARCHAR(255) NOT NULL,
  "action" permission_action NOT NULL,
  "description" TEXT
);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions("module");

-- Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  "roleId" VARCHAR(255) NOT NULL REFERENCES roles("id") ON DELETE CASCADE,
  "permissionId" VARCHAR(255) NOT NULL REFERENCES permissions("id") ON DELETE CASCADE,
  PRIMARY KEY ("roleId", "permissionId")
);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  "id" VARCHAR(255) PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(20),
  "status" admin_status DEFAULT 'ACTIVE',
  "isSuperAdmin" BOOLEAN DEFAULT FALSE,
  "roleId" VARCHAR(255) REFERENCES roles("id"),
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users("status");

-- Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  "id" VARCHAR(255) PRIMARY KEY,
  "tokenHash" VARCHAR(255) NOT NULL UNIQUE,
  "principalType" actor_type NOT NULL,
  "principalId" VARCHAR(255) NOT NULL,
  "userAgent" TEXT,
  "ipAddress" VARCHAR(45),
  "expiresAt" TIMESTAMP NOT NULL,
  "revokedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_principal ON refresh_tokens("principalType", "principalId");

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  "id" VARCHAR(255) PRIMARY KEY,
  "tokenHash" VARCHAR(255) NOT NULL UNIQUE,
  "principalType" actor_type NOT NULL,
  "principalId" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "usedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_principal ON password_reset_tokens("principalType", "principalId");

-- Media
CREATE TABLE IF NOT EXISTS media (
  "id" VARCHAR(255) PRIMARY KEY,
  "bucketKey" VARCHAR(255) NOT NULL,
  "contentType" VARCHAR(100),
  "size" INT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Merchants
CREATE TABLE IF NOT EXISTS merchants (
  "id" VARCHAR(255) PRIMARY KEY,
  "storeName" VARCHAR(255) NOT NULL,
  "storeSlug" VARCHAR(255) NOT NULL UNIQUE,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "status" merchant_status DEFAULT 'PENDING',
  "description" TEXT,
  "logoMediaId" VARCHAR(255) REFERENCES media("id"),
  "bannerMediaId" VARCHAR(255) REFERENCES media("id"),
  "businessRegistrationNumber" VARCHAR(255),
  "taxId" VARCHAR(255),
  "commissionRate" DECIMAL(5, 2) DEFAULT 10.00,
  "approvedById" VARCHAR(255) REFERENCES admin_users("id"),
  "approvedAt" TIMESTAMP,
  "rejectionReason" TEXT,
  "addressLine1" VARCHAR(255),
  "addressLine2" VARCHAR(255),
  "city" VARCHAR(255),
  "state" VARCHAR(255),
  "postalCode" VARCHAR(20),
  "country" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants("status");

-- Merchant Documents
CREATE TABLE IF NOT EXISTS merchant_documents (
  "id" VARCHAR(255) PRIMARY KEY,
  "merchantId" VARCHAR(255) NOT NULL REFERENCES merchants("id") ON DELETE CASCADE,
  "type" merchant_document_type NOT NULL,
  "status" merchant_document_status DEFAULT 'PENDING',
  "mediaId" VARCHAR(255) NOT NULL REFERENCES media("id"),
  "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_merchant_documents_merchantId ON merchant_documents("merchantId");

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  "id" VARCHAR(255) PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(20),
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "status" customer_status DEFAULT 'ACTIVE',
  "emailVerifiedAt" TIMESTAMP,
  "phoneVerifiedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers("status");

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  "id" VARCHAR(255) PRIMARY KEY,
  "customerId" VARCHAR(255) NOT NULL REFERENCES customers("id") ON DELETE CASCADE,
  "label" VARCHAR(255),
  "fullName" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "line1" VARCHAR(255) NOT NULL,
  "line2" VARCHAR(255),
  "city" VARCHAR(255) NOT NULL,
  "state" VARCHAR(255) NOT NULL,
  "postalCode" VARCHAR(20) NOT NULL,
  "country" VARCHAR(255) NOT NULL,
  "type" address_type DEFAULT 'BOTH',
  "isDefault" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_addresses_customerId ON addresses("customerId");

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "description" TEXT,
  "parentId" VARCHAR(255) REFERENCES categories("id"),
  "iconMediaId" VARCHAR(255) REFERENCES media("id"),
  "bannerMediaId" VARCHAR(255) REFERENCES media("id"),
  "isActive" BOOLEAN DEFAULT TRUE,
  "sortOrder" INT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_categories_parentId ON categories("parentId");

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "description" TEXT,
  "logoMediaId" VARCHAR(255) REFERENCES media("id"),
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

-- Attributes
CREATE TABLE IF NOT EXISTS attributes (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "type" attribute_type DEFAULT 'SELECT',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attribute Values
CREATE TABLE IF NOT EXISTS attribute_values (
  "id" VARCHAR(255) PRIMARY KEY,
  "attributeId" VARCHAR(255) NOT NULL REFERENCES attributes("id") ON DELETE CASCADE,
  "value" VARCHAR(255) NOT NULL,
  "colorHex" VARCHAR(7),
  "sortOrder" INT DEFAULT 0,
  UNIQUE("attributeId", "value")
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  "id" VARCHAR(255) PRIMARY KEY,
  "merchantId" VARCHAR(255) NOT NULL REFERENCES merchants("id"),
  "categoryId" VARCHAR(255) NOT NULL REFERENCES categories("id"),
  "brandId" VARCHAR(255) REFERENCES brands("id"),
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "status" product_status DEFAULT 'DRAFT',
  "rejectionReason" TEXT,
  "basePrice" DECIMAL(12, 2) NOT NULL,
  "compareAtPrice" DECIMAL(12, 2),
  "sku" VARCHAR(255),
  "barcode" VARCHAR(255),
  "weight" DECIMAL(8, 2),
  "isFeatured" BOOLEAN DEFAULT FALSE,
  "metaTitle" VARCHAR(255),
  "metaDescription" TEXT,
  "approvedById" VARCHAR(255) REFERENCES admin_users("id"),
  "approvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  UNIQUE("sku")
);
CREATE INDEX IF NOT EXISTS idx_products_merchantId ON products("merchantId");
CREATE INDEX IF NOT EXISTS idx_products_categoryId ON products("categoryId");
CREATE INDEX IF NOT EXISTS idx_products_status ON products("status");

-- Product Attributes
CREATE TABLE IF NOT EXISTS product_attributes (
  "productId" VARCHAR(255) NOT NULL REFERENCES products("id") ON DELETE CASCADE,
  "attributeId" VARCHAR(255) NOT NULL REFERENCES attributes("id") ON DELETE CASCADE,
  PRIMARY KEY ("productId", "attributeId")
);

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  "id" VARCHAR(255) PRIMARY KEY,
  "productId" VARCHAR(255) NOT NULL REFERENCES products("id") ON DELETE CASCADE,
  "sku" VARCHAR(255),
  "barcode" VARCHAR(255),
  "price" DECIMAL(12, 2),
  "compareAtPrice" DECIMAL(12, 2),
  "variantSnapshot" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_variants_productId ON product_variants("productId");

-- Product Variant Attribute Values
CREATE TABLE IF NOT EXISTS product_variant_attribute_values (
  "variantId" VARCHAR(255) NOT NULL REFERENCES product_variants("id") ON DELETE CASCADE,
  "attributeValueId" VARCHAR(255) NOT NULL REFERENCES attribute_values("id") ON DELETE CASCADE,
  PRIMARY KEY ("variantId", "attributeValueId")
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  "id" VARCHAR(255) PRIMARY KEY,
  "variantId" VARCHAR(255) NOT NULL UNIQUE REFERENCES product_variants("id") ON DELETE CASCADE,
  "quantity" INT DEFAULT 0,
  "reservedQuantity" INT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Images
CREATE TABLE IF NOT EXISTS product_images (
  "id" VARCHAR(255) PRIMARY KEY,
  "productId" VARCHAR(255) NOT NULL REFERENCES products("id") ON DELETE CASCADE,
  "variantId" VARCHAR(255) REFERENCES product_variants("id") ON DELETE CASCADE,
  "mediaId" VARCHAR(255) NOT NULL REFERENCES media("id"),
  "sortOrder" INT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_images_productId ON product_images("productId");

-- Carts
CREATE TABLE IF NOT EXISTS carts (
  "id" VARCHAR(255) PRIMARY KEY,
  "customerId" VARCHAR(255) NOT NULL UNIQUE REFERENCES customers("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  "id" VARCHAR(255) PRIMARY KEY,
  "cartId" VARCHAR(255) NOT NULL REFERENCES carts("id") ON DELETE CASCADE,
  "variantId" VARCHAR(255) NOT NULL REFERENCES product_variants("id"),
  "quantity" INT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  "id" VARCHAR(255) PRIMARY KEY,
  "customerId" VARCHAR(255) NOT NULL REFERENCES customers("id"),
  "shippingAddressId" VARCHAR(255) REFERENCES addresses("id"),
  "billingAddressId" VARCHAR(255) REFERENCES addresses("id"),
  "status" order_status DEFAULT 'PENDING',
  "subtotal" DECIMAL(12, 2) NOT NULL,
  "shippingCost" DECIMAL(12, 2),
  "taxAmount" DECIMAL(12, 2),
  "discountAmount" DECIMAL(12, 2),
  "totalAmount" DECIMAL(12, 2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_customerId ON orders("customerId");

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  "id" VARCHAR(255) PRIMARY KEY,
  "orderId" VARCHAR(255) NOT NULL REFERENCES orders("id") ON DELETE CASCADE,
  "merchantId" VARCHAR(255) NOT NULL REFERENCES merchants("id"),
  "productId" VARCHAR(255) NOT NULL REFERENCES products("id"),
  "variantId" VARCHAR(255) REFERENCES product_variants("id"),
  "quantity" INT NOT NULL,
  "unitPrice" DECIMAL(12, 2) NOT NULL,
  "discountAmount" DECIMAL(12, 2),
  "status" order_item_status DEFAULT 'PENDING',
  "productSnapshot" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_merchantId ON order_items("merchantId");

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  "id" VARCHAR(255) PRIMARY KEY,
  "orderId" VARCHAR(255) NOT NULL REFERENCES orders("id") ON DELETE CASCADE,
  "fromStatus" order_status,
  "toStatus" order_status NOT NULL,
  "changedById" VARCHAR(255) REFERENCES admin_users("id"),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_status_history_orderId ON order_status_history("orderId");

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  "id" VARCHAR(255) PRIMARY KEY,
  "orderId" VARCHAR(255) NOT NULL UNIQUE REFERENCES orders("id"),
  "amount" DECIMAL(12, 2) NOT NULL,
  "method" payment_method NOT NULL,
  "status" payment_status DEFAULT 'PENDING',
  "transactionId" VARCHAR(255),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Return Reasons
CREATE TABLE IF NOT EXISTS return_reasons (
  "id" VARCHAR(255) PRIMARY KEY,
  "reason" VARCHAR(255) NOT NULL UNIQUE,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Returns
CREATE TABLE IF NOT EXISTS returns (
  "id" VARCHAR(255) PRIMARY KEY,
  "orderId" VARCHAR(255) NOT NULL REFERENCES orders("id"),
  "merchantId" VARCHAR(255) NOT NULL REFERENCES merchants("id"),
  "customerId" VARCHAR(255) NOT NULL REFERENCES customers("id"),
  "status" return_status DEFAULT 'REQUESTED',
  "reasonId" VARCHAR(255) REFERENCES return_reasons("id"),
  "customReason" TEXT,
  "description" TEXT,
  "refundAmount" DECIMAL(12, 2),
  "refundMethod" VARCHAR(255),
  "shippingTrackingNumber" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_returns_orderId ON returns("orderId");
CREATE INDEX IF NOT EXISTS idx_returns_merchantId ON returns("merchantId");

-- Return Images
CREATE TABLE IF NOT EXISTS return_images (
  "id" VARCHAR(255) PRIMARY KEY,
  "returnId" VARCHAR(255) NOT NULL REFERENCES returns("id") ON DELETE CASCADE,
  "mediaId" VARCHAR(255) NOT NULL REFERENCES media("id"),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_return_images_returnId ON return_images("returnId");

-- Return Status History
CREATE TABLE IF NOT EXISTS return_status_history (
  "id" VARCHAR(255) PRIMARY KEY,
  "returnId" VARCHAR(255) NOT NULL REFERENCES returns("id") ON DELETE CASCADE,
  "fromStatus" return_status,
  "toStatus" return_status NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_return_status_history_returnId ON return_status_history("returnId");

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  "id" VARCHAR(255) PRIMARY KEY,
  "recipientType" notification_recipient_type NOT NULL,
  "recipientId" VARCHAR(255) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "isRead" BOOLEAN DEFAULT FALSE,
  "readAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device Tokens
CREATE TABLE IF NOT EXISTS device_tokens (
  "id" VARCHAR(255) PRIMARY KEY,
  "principalType" actor_type NOT NULL,
  "principalId" VARCHAR(255) NOT NULL,
  "token" VARCHAR(500) NOT NULL UNIQUE,
  "platform" VARCHAR(50),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_principal ON device_tokens("principalType", "principalId");

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  "id" VARCHAR(255) PRIMARY KEY,
  "group" VARCHAR(255) NOT NULL,
  "key" VARCHAR(255) NOT NULL,
  "value" JSONB,
  "description" TEXT,
  "updatedById" VARCHAR(255) REFERENCES admin_users("id"),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("group", "key")
);
CREATE INDEX IF NOT EXISTS idx_settings_group ON settings("group");

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  "id" VARCHAR(255) PRIMARY KEY,
  "mediaId" VARCHAR(255) NOT NULL REFERENCES media("id"),
  "position" banner_position NOT NULL,
  "title" VARCHAR(255),
  "targetUrl" VARCHAR(500),
  "isActive" BOOLEAN DEFAULT TRUE,
  "sortOrder" INT DEFAULT 0,
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  "id" VARCHAR(255) PRIMARY KEY,
  "actorType" actor_type NOT NULL,
  "actorId" VARCHAR(255) NOT NULL,
  "entityType" VARCHAR(255) NOT NULL,
  "entityId" VARCHAR(255) NOT NULL,
  "action" VARCHAR(255) NOT NULL,
  "changes" JSONB,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs("entityType", "entityId");
