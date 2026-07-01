-- Create enums
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

-- Admin Users
CREATE TABLE admin_users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  status admin_status DEFAULT 'ACTIVE',
  is_super_admin BOOLEAN DEFAULT FALSE,
  role_id VARCHAR(255),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_admin_users_status ON admin_users(status);

-- Roles
CREATE TABLE roles (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions
CREATE TABLE permissions (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  module VARCHAR(255) NOT NULL,
  action permission_action NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_permissions_module ON permissions(module);

-- Role Permissions
CREATE TABLE role_permissions (
  role_id VARCHAR(255) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(255) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
  id VARCHAR(255) PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  principal_type actor_type NOT NULL,
  principal_id VARCHAR(255) NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_refresh_tokens_principal ON refresh_tokens(principal_type, principal_id);

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
  id VARCHAR(255) PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  principal_type actor_type NOT NULL,
  principal_id VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_password_reset_tokens_principal ON password_reset_tokens(principal_type, principal_id);

-- Media
CREATE TABLE media (
  id VARCHAR(255) PRIMARY KEY,
  bucket VARCHAR(255) NOT NULL,
  object_key VARCHAR(512) NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR(100),
  size INT,
  width INT,
  height INT,
  uploaded_by_type actor_type,
  uploaded_by_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Merchants
CREATE TABLE merchants (
  id VARCHAR(255) PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL,
  store_slug VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status merchant_status DEFAULT 'PENDING',
  description TEXT,
  logo_media_id VARCHAR(255) REFERENCES media(id),
  banner_media_id VARCHAR(255) REFERENCES media(id),
  business_registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  commission_rate DECIMAL(5, 2) DEFAULT 10.00,
  approved_by_id VARCHAR(255) REFERENCES admin_users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_merchants_status ON merchants(status);

-- Merchant Documents
CREATE TABLE merchant_documents (
  id VARCHAR(255) PRIMARY KEY,
  merchant_id VARCHAR(255) NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  type merchant_document_type NOT NULL,
  status merchant_document_status DEFAULT 'PENDING',
  media_id VARCHAR(255) NOT NULL REFERENCES media(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_merchant_documents_merchant_id ON merchant_documents(merchant_id);

-- Customers
CREATE TABLE customers (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  status customer_status DEFAULT 'ACTIVE',
  email_verified_at TIMESTAMP,
  phone_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_customers_status ON customers(status);

-- Addresses
CREATE TABLE addresses (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  type address_type DEFAULT 'BOTH',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_addresses_customer_id ON addresses(customer_id);

-- Categories
CREATE TABLE categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id VARCHAR(255) REFERENCES categories(id),
  icon_media_id VARCHAR(255) REFERENCES media(id),
  banner_media_id VARCHAR(255) REFERENCES media(id),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Brands
CREATE TABLE brands (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_media_id VARCHAR(255) REFERENCES media(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Attributes
CREATE TABLE attributes (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  type attribute_type DEFAULT 'SELECT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attribute Values
CREATE TABLE attribute_values (
  id VARCHAR(255) PRIMARY KEY,
  attribute_id VARCHAR(255) NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL,
  color_hex VARCHAR(7),
  sort_order INT DEFAULT 0,
  UNIQUE(attribute_id, value)
);

-- Products
CREATE TABLE products (
  id VARCHAR(255) PRIMARY KEY,
  merchant_id VARCHAR(255) NOT NULL REFERENCES merchants(id),
  category_id VARCHAR(255) NOT NULL REFERENCES categories(id),
  brand_id VARCHAR(255) REFERENCES brands(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  status product_status DEFAULT 'DRAFT',
  rejection_reason TEXT,
  base_price DECIMAL(12, 2) NOT NULL,
  compare_at_price DECIMAL(12, 2),
  sku VARCHAR(100),
  barcode VARCHAR(100),
  weight DECIMAL(8, 2),
  is_featured BOOLEAN DEFAULT FALSE,
  meta_title VARCHAR(255),
  meta_description TEXT,
  approved_by_id VARCHAR(255) REFERENCES admin_users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_products_merchant_id ON products(merchant_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);

-- Product Attributes
CREATE TABLE product_attributes (
  product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id VARCHAR(255) NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, attribute_id)
);

-- Product Variants
CREATE TABLE product_variants (
  id VARCHAR(255) PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL UNIQUE,
  barcode VARCHAR(100),
  price DECIMAL(12, 2) NOT NULL,
  compare_at_price DECIMAL(12, 2),
  weight DECIMAL(8, 2),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

-- Product Variant Attribute Values
CREATE TABLE product_variant_attribute_values (
  variant_id VARCHAR(255) NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_value_id VARCHAR(255) NOT NULL REFERENCES attribute_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, attribute_value_id)
);

-- Inventory
CREATE TABLE inventory (
  id VARCHAR(255) PRIMARY KEY,
  variant_id VARCHAR(255) NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT DEFAULT 0,
  reserved_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Images
CREATE TABLE product_images (
  id VARCHAR(255) PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id VARCHAR(255) REFERENCES product_variants(id) ON DELETE CASCADE,
  media_id VARCHAR(255) NOT NULL REFERENCES media(id),
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- Cart
CREATE TABLE carts (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items
CREATE TABLE cart_items (
  id VARCHAR(255) PRIMARY KEY,
  cart_id VARCHAR(255) NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id VARCHAR(255) NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  price_snapshot DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cart_id, variant_id)
);

-- Orders
CREATE TABLE orders (
  id VARCHAR(255) PRIMARY KEY,
  order_number VARCHAR(255) NOT NULL UNIQUE,
  customer_id VARCHAR(255) NOT NULL REFERENCES customers(id),
  status order_status DEFAULT 'PENDING',
  subtotal DECIMAL(12, 2) NOT NULL,
  shipping_fee DECIMAL(12, 2) DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  shipping_address_id VARCHAR(255) NOT NULL REFERENCES addresses(id),
  billing_address_id VARCHAR(255) NOT NULL REFERENCES addresses(id),
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Order Items
CREATE TABLE order_items (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  merchant_id VARCHAR(255) NOT NULL REFERENCES merchants(id),
  product_id VARCHAR(255) NOT NULL REFERENCES products(id),
  variant_id VARCHAR(255) NOT NULL REFERENCES product_variants(id),
  product_name_snapshot VARCHAR(255) NOT NULL,
  variant_snapshot JSONB,
  quantity INT NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  status order_item_status DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_merchant_id ON order_items(merchant_id);

-- Order Status History
CREATE TABLE order_status_history (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  note TEXT,
  changed_by_id VARCHAR(255) REFERENCES admin_users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- Payments
CREATE TABLE payments (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL UNIQUE REFERENCES orders(id),
  method payment_method NOT NULL,
  provider VARCHAR(100),
  provider_payment_id VARCHAR(255),
  status payment_status DEFAULT 'PENDING',
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Return Reasons
CREATE TABLE return_reasons (
  id VARCHAR(255) PRIMARY KEY,
  label VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

-- Returns
CREATE TABLE returns (
  id VARCHAR(255) PRIMARY KEY,
  return_number VARCHAR(255) NOT NULL UNIQUE,
  order_id VARCHAR(255) NOT NULL REFERENCES orders(id),
  order_item_id VARCHAR(255) NOT NULL REFERENCES order_items(id),
  customer_id VARCHAR(255) NOT NULL REFERENCES customers(id),
  merchant_id VARCHAR(255) NOT NULL REFERENCES merchants(id),
  reason_id VARCHAR(255) NOT NULL REFERENCES return_reasons(id),
  reason_detail TEXT,
  status return_status DEFAULT 'REQUESTED',
  quantity INT NOT NULL,
  refund_amount DECIMAL(12, 2),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_merchant_id ON returns(merchant_id);
CREATE INDEX idx_returns_status ON returns(status);

-- Return Images
CREATE TABLE return_images (
  id VARCHAR(255) PRIMARY KEY,
  return_id VARCHAR(255) NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  media_id VARCHAR(255) NOT NULL REFERENCES media(id),
  sort_order INT DEFAULT 0
);
CREATE INDEX idx_return_images_return_id ON return_images(return_id);

-- Return Status History
CREATE TABLE return_status_history (
  id VARCHAR(255) PRIMARY KEY,
  return_id VARCHAR(255) NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  status return_status NOT NULL,
  note TEXT,
  changed_by_type actor_type NOT NULL,
  changed_by_id VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_return_status_history_return_id ON return_status_history(return_id);

-- Notifications
CREATE TABLE notifications (
  id VARCHAR(255) PRIMARY KEY,
  recipient_type notification_recipient_type NOT NULL,
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  merchant_id VARCHAR(255) REFERENCES merchants(id) ON DELETE CASCADE,
  admin_user_id VARCHAR(255) REFERENCES admin_users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_customer ON notifications(recipient_type, customer_id);
CREATE INDEX idx_notifications_merchant ON notifications(recipient_type, merchant_id);
CREATE INDEX idx_notifications_admin ON notifications(recipient_type, admin_user_id);

-- Device Tokens
CREATE TABLE device_tokens (
  id VARCHAR(255) PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  principal_type actor_type NOT NULL,
  principal_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_device_tokens_principal ON device_tokens(principal_type, principal_id);

-- Settings
CREATE TABLE settings (
  id VARCHAR(255) PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  group_name VARCHAR(100) NOT NULL,
  updated_by_id VARCHAR(255) REFERENCES admin_users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_settings_group ON settings(group_name);

-- Banners
CREATE TABLE banners (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  media_id VARCHAR(255) NOT NULL REFERENCES media(id),
  link_url TEXT,
  position banner_position NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_banners_position_active ON banners(position, is_active);

-- Audit Log
CREATE TABLE audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  actor_type actor_type NOT NULL,
  actor_id VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id);

-- Add foreign key for admin_users.role_id
ALTER TABLE admin_users ADD CONSTRAINT fk_admin_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id);
