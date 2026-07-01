-- Create enums
CREATE TYPE IF NOT EXISTSIF NOT EXISTS admin_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE IF NOT EXISTSIF NOT EXISTS permission_action AS ENUM ('VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT');
CREATE TYPE IF NOT EXISTSIF NOT EXISTS merchant_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE IF NOT EXISTSmerchant_document_type AS ENUM ('BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'ID_PROOF', 'BANK_DETAILS', 'OTHER');
CREATE TYPE IF NOT EXISTSmerchant_document_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE IF NOT EXISTScustomer_status AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
CREATE TYPE IF NOT EXISTSaddress_type AS ENUM ('SHIPPING', 'BILLING', 'BOTH');
CREATE TYPE IF NOT EXISTSproduct_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE IF NOT EXISTSattribute_type AS ENUM ('SELECT', 'COLOR', 'TEXT');
CREATE TYPE IF NOT EXISTSorder_status AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE IF NOT EXISTSorder_item_status AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');
CREATE TYPE IF NOT EXISTSpayment_method AS ENUM ('CARD', 'UPI', 'NETBANKING', 'WALLET', 'COD');
CREATE TYPE IF NOT EXISTSpayment_status AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');
CREATE TYPE IF NOT EXISTSreturn_status AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'AWAITING_SHIPMENT', 'ITEM_RECEIVED', 'COMPLETED', 'CANCELLED');
CREATE TYPE IF NOT EXISTSactor_type AS ENUM ('ADMIN', 'MERCHANT', 'CUSTOMER', 'SYSTEM');
CREATE TYPE IF NOT EXISTSnotification_recipient_type AS ENUM ('CUSTOMER', 'MERCHANT', 'ADMIN');
CREATE TYPE IF NOT EXISTSbanner_position AS ENUM ('HOME_HERO', 'HOME_SECONDARY', 'CATEGORY_TOP', 'STOREFRONT_TOP');

-- Admin Users
CREATE TABLE IF NOT EXISTSadmin_users (
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
CREATE INDEX IF NOT EXISTSidx_admin_users_status ON admin_users(status);

-- Roles
CREATE TABLE IF NOT EXISTSroles (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions
CREATE TABLE IF NOT EXISTSpermissions (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  module VARCHAR(255) NOT NULL,
  action permission_action NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTSidx_permissions_module ON permissions(module);

-- Role Permissions
CREATE TABLE IF NOT EXISTSrole_permissions (
  role_id VARCHAR(255) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(255) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Refresh Tokens
CREATE TABLE IF NOT EXISTSrefresh_tokens (
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
CREATE INDEX IF NOT EXISTSidx_refresh_tokens_principal ON refresh_tokens(principal_type, principal_id);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTSpassword_reset_tokens (
  id VARCHAR(255) PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  principal_type actor_type NOT NULL,
  principal_id VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTSidx_password_reset_tokens_principal ON password_reset_tokens(principal_type, principal_id);

-- Media
CREATE TABLE IF NOT EXISTSmedia (
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
CREATE TABLE IF NOT EXISTSmerchants (
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
CREATE INDEX IF NOT EXISTSidx_merchants_status ON merchants(status);

-- Merchant Documents
CREATE TABLE IF NOT EXISTSmerchant_documents (
  id VARCHAR(255) PRIMARY KEY,
  merchant_id VARCHAR(255) NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  type merchant_document_type NOT NULL,
  status merchant_document_status DEFAULT 'PENDING',
  media_id VARCHAR(255) NOT NULL REFERENCES media(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTSidx_merchant_documents_merchant_id ON merchant_documents(merchant_id);

-- Customers
CREATE TABLE IF NOT EXISTScustomers (
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
CREATE INDEX IF NOT EXISTSidx_customers_status ON customers(status);

-- Addresses
CREATE TABLE IF NOT EXISTSaddresses (
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
CREATE INDEX IF NOT EXISTSidx_addresses_customer_id ON addresses(customer_id);

-- Categories
CREATE TABLE IF NOT EXISTScategories (
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
CREATE INDEX IF NOT EXISTSidx_categories_parent_id ON categories(parent_id);

-- Brands
CREATE TABLE IF NOT EXISTSbrands (
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
CREATE TABLE IF NOT EXISTSattributes (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  type attribute_type DEFAULT 'SELECT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attribute Values
CREATE TABLE IF NOT EXISTSattribute_values (
  id VARCHAR(255) PRIMARY KEY,
  attribute_id VARCHAR(255) NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL,
  color_hex VARCHAR(7),
  sort_order INT DEFAULT 0,
  UNIQUE(attribute_id, value)
);

-- Products
CREATE TABLE IF NOT EXISTSproducts (
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
CREATE INDEX IF NOT EXISTSidx_products_merchant_id ON products(merchant_id);
CREATE INDEX IF NOT EXISTSidx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTSidx_products_status ON products(status);

-- Product Attributes
CREATE TABLE IF NOT EXISTSproduct_attributes (
  product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id VARCHAR(255) NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, attribute_id)
);

-- Product Variants
CREATE TABLE IF NOT EXISTSproduct_variants (
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
CREATE INDEX IF NOT EXISTSidx_product_variants_product_id ON product_variants(product_id);

-- Product Variant Attribute Values
CREATE TABLE IF NOT EXISTSproduct_variant_attribute_values (
  variant_id VARCHAR(255) NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_value_id VARCHAR(255) NOT NULL REFERENCES attribute_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, attribute_value_id)
);

-- Inventory
CREATE TABLE IF NOT EXISTSinventory (
  id VARCHAR(255) PRIMARY KEY,
  variant_id VARCHAR(255) NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT DEFAULT 0,
  reserved_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Images
CREATE TABLE IF NOT EXISTSproduct_images (
  id VARCHAR(255) PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id VARCHAR(255) REFERENCES product_variants(id) ON DELETE CASCADE,
  media_id VARCHAR(255) NOT NULL REFERENCES media(id),
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTSidx_product_images_product_id ON product_images(product_id);

-- Cart
CREATE TABLE IF NOT EXISTScarts (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items
CREATE TABLE IF NOT EXISTScart_items (
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
CREATE TABLE IF NOT EXISTSorders (
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
CREATE INDEX IF NOT EXISTSidx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTSidx_orders_status ON orders(status);

-- Order Items
CREATE TABLE IF NOT EXISTSorder_items (
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
CREATE INDEX IF NOT EXISTSidx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTSidx_order_items_merchant_id ON order_items(merchant_id);

-- Order Status History
CREATE TABLE IF NOT EXISTSorder_status_history (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  note TEXT,
  changed_by_id VARCHAR(255) REFERENCES admin_users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTSidx_order_status_history_order_id ON order_status_history(order_id);

-- Payments
CREATE TABLE IF NOT EXISTSpayments (
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
CREATE TABLE IF NOT EXISTSreturn_reasons (
  id VARCHAR(255) PRIMARY KEY,
  label VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

-- Returns
CREATE TABLE IF NOT EXISTSreturns (
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
CREATE INDEX IF NOT EXISTSidx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTSidx_returns_merchant_id ON returns(merchant_id);
CREATE INDEX IF NOT EXISTSidx_returns_status ON returns(status);

-- Return Images
CREATE TABLE IF NOT EXISTSreturn_images (
  id VARCHAR(255) PRIMARY KEY,
  return_id VARCHAR(255) NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  media_id VARCHAR(255) NOT NULL REFERENCES media(id),
  sort_order INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTSidx_return_images_return_id ON return_images(return_id);

-- Return Status History
CREATE TABLE IF NOT EXISTSreturn_status_history (
  id VARCHAR(255) PRIMARY KEY,
  return_id VARCHAR(255) NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  status return_status NOT NULL,
  note TEXT,
  changed_by_type actor_type NOT NULL,
  changed_by_id VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTSidx_return_status_history_return_id ON return_status_history(return_id);

-- Notifications
CREATE TABLE IF NOT EXISTSnotifications (
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
CREATE INDEX IF NOT EXISTSidx_notifications_customer ON notifications(recipient_type, customer_id);
CREATE INDEX IF NOT EXISTSidx_notifications_merchant ON notifications(recipient_type, merchant_id);
CREATE INDEX IF NOT EXISTSidx_notifications_admin ON notifications(recipient_type, admin_user_id);

-- Device Tokens
CREATE TABLE IF NOT EXISTSdevice_tokens (
  id VARCHAR(255) PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  principal_type actor_type NOT NULL,
  principal_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTSidx_device_tokens_principal ON device_tokens(principal_type, principal_id);

-- Settings
CREATE TABLE IF NOT EXISTSsettings (
  id VARCHAR(255) PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  group_name VARCHAR(100) NOT NULL,
  updated_by_id VARCHAR(255) REFERENCES admin_users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTSidx_settings_group ON settings(group_name);

-- Banners
CREATE TABLE IF NOT EXISTSbanners (
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
CREATE INDEX IF NOT EXISTSidx_banners_position_active ON banners(position, is_active);

-- Audit Log
CREATE TABLE IF NOT EXISTSaudit_logs (
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
CREATE INDEX IF NOT EXISTSidx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTSidx_audit_logs_actor ON audit_logs(actor_type, actor_id);

-- Add foreign key for admin_users.role_id
ALTER TABLE admin_users ADD CONSTRAINT fk_admin_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id);
