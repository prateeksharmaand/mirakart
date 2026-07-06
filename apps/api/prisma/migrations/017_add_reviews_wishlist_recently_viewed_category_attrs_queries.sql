-- Migration 017: Add Review, WishlistItem, RecentlyViewed, CategoryAttribute, CustomerQuery tables

-- Reviews
CREATE TABLE IF NOT EXISTS "reviews" (
    "id"               TEXT        NOT NULL PRIMARY KEY,
    "productId"        TEXT        NOT NULL,
    "customerId"       TEXT        NOT NULL,
    "rating"           INTEGER     NOT NULL,
    "title"            TEXT,
    "body"             TEXT,
    "verifiedPurchase" BOOLEAN     NOT NULL DEFAULT false,
    "isApproved"       BOOLEAN     NOT NULL DEFAULT true,
    "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deletedAt"        TIMESTAMPTZ,
    CONSTRAINT "reviews_productId_fkey"  FOREIGN KEY ("productId")  REFERENCES "products"("id")  ON DELETE CASCADE,
    CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE,
    CONSTRAINT "reviews_productId_customerId_key" UNIQUE ("productId", "customerId")
);
CREATE INDEX IF NOT EXISTS "reviews_productId_isApproved_idx" ON "reviews"("productId", "isApproved");
CREATE INDEX IF NOT EXISTS "reviews_customerId_idx"           ON "reviews"("customerId");

-- Wishlist items
CREATE TABLE IF NOT EXISTS "wishlist_items" (
    "id"         TEXT        NOT NULL PRIMARY KEY,
    "customerId" TEXT        NOT NULL,
    "productId"  TEXT        NOT NULL,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "wishlist_items_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE,
    CONSTRAINT "wishlist_items_productId_fkey"  FOREIGN KEY ("productId")  REFERENCES "products"("id")  ON DELETE CASCADE,
    CONSTRAINT "wishlist_items_customerId_productId_key" UNIQUE ("customerId", "productId")
);
CREATE INDEX IF NOT EXISTS "wishlist_items_customerId_idx" ON "wishlist_items"("customerId");

-- Recently viewed
CREATE TABLE IF NOT EXISTS "recently_viewed" (
    "id"         TEXT        NOT NULL PRIMARY KEY,
    "customerId" TEXT        NOT NULL,
    "productId"  TEXT        NOT NULL,
    "viewedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "recently_viewed_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE,
    CONSTRAINT "recently_viewed_productId_fkey"  FOREIGN KEY ("productId")  REFERENCES "products"("id")  ON DELETE CASCADE,
    CONSTRAINT "recently_viewed_customerId_productId_key" UNIQUE ("customerId", "productId")
);
CREATE INDEX IF NOT EXISTS "recently_viewed_customerId_idx" ON "recently_viewed"("customerId");

-- Category → Attribute assignments
CREATE TABLE IF NOT EXISTS "category_attributes" (
    "id"          TEXT        NOT NULL PRIMARY KEY,
    "categoryId"  TEXT        NOT NULL,
    "attributeId" TEXT        NOT NULL,
    "sortOrder"   INTEGER     NOT NULL DEFAULT 0,
    "isRequired"  BOOLEAN     NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "category_attributes_categoryId_fkey"  FOREIGN KEY ("categoryId")  REFERENCES "categories"("id")  ON DELETE CASCADE,
    CONSTRAINT "category_attributes_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE CASCADE,
    CONSTRAINT "category_attributes_categoryId_attributeId_key" UNIQUE ("categoryId", "attributeId")
);
CREATE INDEX IF NOT EXISTS "category_attributes_categoryId_idx" ON "category_attributes"("categoryId");

-- Customer product Q&A
CREATE TABLE IF NOT EXISTS "customer_queries" (
    "id"                   TEXT        NOT NULL PRIMARY KEY,
    "productId"            TEXT        NOT NULL,
    "customerId"           TEXT,
    "guestName"            TEXT,
    "guestEmail"           TEXT,
    "question"             TEXT        NOT NULL,
    "answer"               TEXT,
    "answeredAt"           TIMESTAMPTZ,
    "answeredByMerchantId" TEXT,
    "isPublic"             BOOLEAN     NOT NULL DEFAULT true,
    "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deletedAt"            TIMESTAMPTZ,
    CONSTRAINT "customer_queries_productId_fkey"  FOREIGN KEY ("productId")  REFERENCES "products"("id")  ON DELETE CASCADE,
    CONSTRAINT "customer_queries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "customer_queries_productId_isPublic_idx" ON "customer_queries"("productId", "isPublic");
CREATE INDEX IF NOT EXISTS "customer_queries_customerId_idx"          ON "customer_queries"("customerId");
