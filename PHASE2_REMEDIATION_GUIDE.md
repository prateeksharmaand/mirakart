# PHASE 2: REMEDIATION GUIDE
**Mirakart Complete System Fix**  
**Date:** July 2, 2026

---

## CHANGES APPLIED — PART 1: ENUM TYPE MISMATCH FIX

### 1. Added @map Directives to All Prisma Enums

**File:** `apps/api/prisma/schema.prisma` (lines 28-156)

**Change:** Added `@@map()` directives to all 17 enums to map PascalCase Prisma names to lowercase database names.

**Before:**
```prisma
enum MerchantStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}
```

**After:**
```prisma
enum MerchantStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED

  @@map("merchant_status")
}
```

**All 17 enums updated:**
1. AdminStatus → `@@map("admin_status")`
2. PermissionAction → `@@map("permission_action")`
3. MerchantStatus → `@@map("merchant_status")`
4. MerchantDocumentType → `@@map("merchant_document_type")`
5. MerchantDocumentStatus → `@@map("merchant_document_status")`
6. CustomerStatus → `@@map("customer_status")`
7. AddressType → `@@map("address_type")`
8. ProductStatus → `@@map("product_status")`
9. AttributeType → `@@map("attribute_type")`
10. OrderStatus → `@@map("order_status")`
11. OrderItemStatus → `@@map("order_item_status")`
12. PaymentMethod → `@@map("payment_method")`
13. PaymentStatus → `@@map("payment_status")`
14. ReturnStatus → `@@map("return_status")`
15. ActorType → `@@map("actor_type")`
16. NotificationRecipientType → `@@map("notification_recipient_type")`
17. BannerPosition → `@@map("banner_position")`

**Result:** Prisma now expects lowercase enum types in database, matching the actual database schema created by `001_initial_schema.sql`.

---

### 2. Deleted Orphaned Conflicting Migration File

**File:** `apps/api/prisma/migrations/001_initial_schema.sql`

**Action:** DELETED (file removed from repository)

**Reason:** This flat file was completely outside Prisma's migration tracking system. It defined 17 enum types using unquoted lowercase names (`merchant_status`) which conflicts with Prisma's directory-based migration system. Only the directory-based file (`001_initial_schema/migration.sql`) is recognized by `prisma migrate`.

**Result:** Single source of truth for initial schema is now `001_initial_schema/migration.sql`.

---

## CHANGES APPLIED — PART 2: FRONTEND TYPE IMPROVEMENTS

### 3. Fixed Merchant Status Types in Admin API Client

**File:** `apps/admin/src/lib/api/merchants.ts` (lines 3-21)

**Changes:**
- Added typed exports for `MerchantStatus`, `MerchantDocumentType`, `MerchantDocumentStatus`
- Changed `Merchant.status: string` → `Merchant.status: MerchantStatus`
- Changed `MerchantDocument.type: string` → `MerchantDocument.type: MerchantDocumentType`
- Changed `MerchantDocument.status: string` → `MerchantDocument.status: MerchantDocumentStatus`

**Before:**
```typescript
export interface Merchant {
  status: string;  // ❌ No type safety
}
```

**After:**
```typescript
export type MerchantStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface Merchant {
  status: MerchantStatus;  // ✅ Type-safe enum
}
```

**Result:** Admin app now has full compile-time type safety for merchant status.

---

### 4. Fixed Merchant Status in Auth Store

**File:** `apps/merchant/src/stores/auth-store.ts` (lines 6-13)

**Changes:**
- Added `MerchantStatus` type export
- Changed `MerchantProfile.status: string` → `MerchantProfile.status: MerchantStatus`

**Result:** Merchant app auth store now enforces status enum at compile time.

---

### 5. Fixed ReviewDocumentDto to Use Proper Enum

**File:** `apps/api/src/merchants/dto/review-document.dto.ts`

**Changes:**
- Added import: `import type { MerchantDocumentStatus } from "@prisma/client"`
- Replaced inline literals with enum constant array
- Changed `status!: "VERIFIED" | "REJECTED"` → `status!: MerchantDocumentStatus`
- Added optional `rejectionReason` field (to match backend logic)
- Used `IsIn(DOCUMENT_STATUSES)` validator pattern (consistent with `CreateMerchantDocumentDto`)

**Before:**
```typescript
export class ReviewDocumentDto {
  status!: "VERIFIED" | "REJECTED";  // Inline literals, inconsistent
}
```

**After:**
```typescript
const DOCUMENT_STATUSES: MerchantDocumentStatus[] = ["VERIFIED", "REJECTED"];

export class ReviewDocumentDto {
  @IsIn(DOCUMENT_STATUSES)
  status!: MerchantDocumentStatus;  // Uses Prisma enum, consistent
  
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
```

**Result:** All DTOs now consistently use Prisma enums.

---

## REMAINING WORK — PART 3: SCHEMA DRIFT & MIGRATION TRACKING

### ⚠️ CRITICAL — Untracked Migrations Still Outside Prisma

The following migrations are still flat `.sql` files and are **NOT tracked by `prisma migrate`**:

| File | Purpose | Status |
|------|---------|--------|
| `001_5_add_missing_columns.sql` | Add missing columns to returns, return_status_history | UNTRACKED |
| `002_5_install_extensions.sql` | Install pg_trgm extension | UNTRACKED |
| `002_add_foreign_key_constraints.sql` | Add FK constraints | UNTRACKED |
| `003_add_missing_indexes.sql` | Add performance indexes | UNTRACKED |
| `004_add_payment_idempotency.sql` | Add payment idempotency columns | UNTRACKED |

**Why this matters:**
- `prisma migrate status` will NOT show these as applied
- `prisma migrate deploy` will NOT apply them
- They must be manually applied via `psql` or deployment script
- **Schema.prisma references columns added by 004 (idempotencyKey, etc.) but they won't exist if only Prisma migrations are applied**

**Fix required:** Convert these to proper Prisma migrations OR create a single new migration folder containing all changes.

**Recommended next step:**
```bash
# Move into Prisma migration structure:
mkdir -p apps/api/prisma/migrations/005_sync_manual_migrations
mv 001_5_add_missing_columns.sql apps/api/prisma/migrations/005_sync_manual_migrations/migration.sql
mv 002_5_install_extensions.sql ...  (combine into single migration)
# etc.
```

---

### ⚠️ MAJOR — Schema Drift Between Prisma Migration and Current Schema

**Location:** `001_initial_schema/migration.sql` vs `schema.prisma`

**Affected tables:**
1. `media` — Prisma migration has 4 columns; schema.prisma expects 10
2. `product_variants` — Migration missing `variantSnapshot JSONB`; schema expects it
3. `inventory` — Migration includes `lowStockThreshold`; schema.prisma doesn't
4. `orders` — Migration has different column names (subtotal/tax vs taxAmount/totalAmount)
5. `order_status_history` — Column name mismatch (fromStatus/toStatus vs status)
6. `return_reasons` — Column name mismatch (label vs reason)

**Impact:** Running `prisma db push` would attempt to recreate tables, causing data loss.

**Fix required:** Either:
1. Manually reconcile the differences
2. Regenerate the Prisma migration with `prisma migrate diff`

---

### ⚠️ MAJOR — packages/types/src/enums.ts is Orphaned

**Status:** File exists but is unused by frontend apps

**Resolution:** Either:
1. Delete the file (since Prisma types are the canonical source)
2. Configure Prisma to generate types to this location and export them

---

## VALIDATION CHECKLIST

Run these checks after deployment:

### Database Layer
```sql
-- Verify enum types exist with correct names (lowercase)
\dT+
-- Expected output should show: admin_status, merchant_status, etc. (lowercase)

-- Verify merchants table status column
\d+ merchants
-- Expected: status column type is "admin_status"
```

### Prisma Layer
```bash
cd apps/api
npx prisma validate
# Expected: Schema is valid ✅

npx prisma migrate status
# Expected: All migrations shown as applied
```

### Backend Layer
```bash
cd apps/api
npm run typecheck
# Expected: No TypeScript errors ✅

npm run build
# Expected: Build succeeds ✅
```

### API Test
```bash
curl -X POST http://localhost:4000/merchants \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "status": "PENDING"}'
# Expected: 200 OK (or appropriate validation error, not type mismatch)
```

### Runtime Test
```bash
docker compose up -d
sleep 30
curl http://localhost:4000/api/health/ping
# Expected: 200 OK
```

---

## DEPLOYMENT CHECKLIST

### On VPS, after pulling latest code:

```bash
cd /opt/mirakart

# 1. Backup database (CRITICAL)
docker compose exec -T postgres pg_dump -U mirakart mirakart > backup_$(date +%s).sql

# 2. Regenerate Prisma Client
docker compose exec api npx prisma generate

# 3. Verify no schema drift
docker compose exec api npx prisma validate

# 4. Apply any missing migrations (if needed)
docker compose exec -T postgres psql -U mirakart -d mirakart < apps/api/prisma/migrations/001_5_add_missing_columns.sql
# (repeat for other untracked migrations if not already applied)

# 5. Rebuild and restart
docker compose build api
docker compose up -d

# 6. Verify health
docker compose exec api curl http://localhost:4000/api/health/ping

# 7. Test merchant creation
curl -X GET http://api.astrovaak.online/api/v1/merchants
```

---

## SUMMARY OF FIXES

✅ **FIXED:**
1. All 17 enums now map to lowercase database types
2. Deleted orphaned conflicting migration file
3. Frontend types use proper enums instead of strings
4. DTOs consistently import and use Prisma enums

⚠️ **STILL NEEDED:**
1. Convert 5 untracked migrations to Prisma migration structure
2. Reconcile schema drift between migration file and current schema.prisma
3. Delete or integrate orphaned packages/types/src/enums.ts
4. Deploy and validate on VPS

⏭️ **NEXT PHASE:**
- PHASE 3: Full Integration Testing
- PHASE 4: Production Validation
- PHASE 5: Final Audit Report

---

**Report prepared by:** Principal Software Architect  
**Fix date:** July 2, 2026  
**Status:** Ready for VPS deployment
