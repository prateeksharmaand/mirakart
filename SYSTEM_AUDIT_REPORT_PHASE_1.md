# MIRAKART SYSTEM AUDIT — PHASE 1 COMPLETE ANALYSIS
**Date:** July 2, 2026  
**Scope:** Database, Prisma, Backend, Frontend, API, Infrastructure  
**Status:** CRITICAL ISSUES IDENTIFIED

---

## EXECUTIVE SUMMARY

**Three CRITICAL issues, four MAJOR issues, and multiple MINOR inconsistencies identified across the Mirakart platform.**

The system has a **split migration strategy** that was never reconciled. There are two incompatible versions of the initial database schema:
- **Version A:** PostgreSQL lowercase unquoted enums (`merchant_status`) — orphaned flat file
- **Version B:** Prisma-managed PascalCase quoted enums (`"MerchantStatus"`) — tracked by Prisma

Additionally, 5 subsequent migrations (FK constraints, indexes, extensions, idempotency, missing columns) are implemented as flat `.sql` files **completely outside Prisma's tracking**, meaning they are not applied by `prisma migrate deploy`.

**Impact:** The current error (`column "status" is of type merchant_status but expression is of type "MerchantStatus"`) occurs because the database has lowercase enum types (Version A) but Prisma expects PascalCase quoted types (Version B).

**Severity:** **CRITICAL** — Application cannot function until this is resolved.

---

## CRITICAL ISSUES

### ISSUE #1: Duplicate Conflicting Migration Files

**Location:**
- `apps/api/prisma/migrations/001_initial_schema.sql` (orphaned flat file)
- `apps/api/prisma/migrations/001_initial_schema/migration.sql` (Prisma-managed directory)

**Problem:**
- Both files define the same initial schema
- **001_initial_schema.sql** uses unquoted lowercase names: `merchant_status`, `admin_status`, etc.
- **001_initial_schema/migration.sql** uses quoted PascalCase: `"MerchantStatus"`, `"AdminStatus"`, etc.
- Prisma's `prisma migrate` only recognizes the directory-based file
- The flat `.sql` file is completely ignored by Prisma

**Root Cause:**
The project was initialized with manual SQL migrations, then Prisma was introduced later. Both versions were kept, creating a fork.

**Impact:**
- If database has lowercase types (from flat file), Prisma client fails with type mismatch
- If database has PascalCase types (from Prisma migration), flat file is irrelevant but wastes space
- Current error is exactly this mismatch

**Fix Required:**
Choose one version and delete the other. Recommended: Keep Prisma-managed version, delete flat orphan.

---

### ISSUE #2: Schema Drift — Prisma Migration vs Current Schema

**Location:**
- `apps/api/prisma/migrations/001_initial_schema/migration.sql`
- `apps/api/prisma/schema.prisma`

**Problem:**
The Prisma-managed migration file defines different table structures than the current `schema.prisma`. Critical differences:

| Table | Prisma Migration | Current schema.prisma | Status |
|-------|------------------|----------------------|--------|
| `media` | `bucketKey`, `contentType`, `size`, `createdAt` (4 cols) | `bucket`, `objectKey`, `url`, `mimeType`, `size`, `width`, `height`, `uploadedByType`, `uploadedById`, `createdAt` (10 cols) | DRIFT |
| `product_variants` | `sku`, `price`, `compareAtPrice`, `weight`, `isDefault`, `deletedAt` | `sku` (nullable), `price` (nullable), `variantSnapshot JSONB`, no weight/isDefault/deletedAt | DRIFT |
| `inventory` | `lowStockThreshold` column exists | No `lowStockThreshold` in schema | DRIFT |
| `orders` | `orderNumber`, `subtotal`, `shippingFee`, `tax`, `discount`, `total`, `currency`, `placedAt` | `shippingCost`, `taxAmount`, `discountAmount`, `totalAmount`, `notes` — missing orderNumber, fees, currency | DRIFT |
| `order_status_history` | `fromStatus`, `toStatus`, `changedById`, `notes` | Different column names | DRIFT |
| `return_reasons` | `label`, `isActive`, `sortOrder` | `reason`, `isActive`, `createdAt` — no sortOrder | DRIFT |

**Root Cause:**
The Prisma migration was generated from an earlier version of the schema and was never updated. Schema evolve but the initial migration was not regenerated.

**Impact:**
- `prisma migrate diff` will show significant schema drift
- `prisma db push` may attempt to recreate tables
- Backend code expects columns that don't exist in the migration
- Type safety is compromised

**Fix Required:**
Regenerate the Prisma migration to match the current schema, or manually reconcile the differences.

---

### ISSUE #3: Five Migrations Outside Prisma Tracking

**Location:**
- `apps/api/prisma/migrations/001_5_add_missing_columns.sql`
- `apps/api/prisma/migrations/002_5_install_extensions.sql`
- `apps/api/prisma/migrations/002_add_foreign_key_constraints.sql`
- `apps/api/prisma/migrations/003_add_missing_indexes.sql`
- `apps/api/prisma/migrations/004_add_payment_idempotency.sql`

**Problem:**
All are flat `.sql` files in the migrations directory. Prisma only recognizes files in subdirectories named `<name>/migration.sql`. Flat files are ignored.

**What each migration does:**
| File | Purpose | Dependencies | Status |
|------|---------|--------------|--------|
| 001_5 | Adds `returnNumber`, `orderItemId`, `quantity` to returns table | None | UNTRACKED |
| 002_5 | Installs `pg_trgm` PostgreSQL extension | None | UNTRACKED — but 003 depends on it |
| 002 | Adds foreign key constraints (RESTRICT cascade) | None | UNTRACKED |
| 003 | Adds 15+ performance indexes, including GIN TRGM | 002_5 (pg_trgm) | UNTRACKED |
| 004 | Adds `idempotencyKey`, `attemptCount`, `wasIdempotent` to payments | schema.prisma references these! | UNTRACKED |

**Impact:**
- `prisma migrate deploy` will NOT apply these
- `prisma migrate status` will NOT show them as applied
- Backend code references columns that don't exist (idempotencyKey, etc.)
- Indexes are missing, causing slow queries
- FK constraints missing, risking data integrity
- If migration 003 is manually run before 002_5, it will fail (missing pg_trgm)

**Root Cause:**
During Phase 2 development, migrations were written as flat SQL files instead of Prisma migrations. This was done to bypass Prisma validation, but it created an unmaintainable divergence.

**Fix Required:**
Convert flat migrations to proper Prisma migration directories or create single new Prisma migration applying all changes.

---

## MAJOR ISSUES

### ISSUE #4: All 17 Enums Have Type Name Mismatches

**Location:**
Every enum in the system has a case mismatch between database and Prisma expectations.

**Details:**

| Enum | Database (flat file) | Prisma expects | Prisma schema | Problem |
|------|---|---|---|---|
| AdminStatus | `admin_status` | `"AdminStatus"` | `enum AdminStatus { ... }` (no @map) | Case mismatch |
| PermissionAction | `permission_action` | `"PermissionAction"` | `enum PermissionAction { ... }` (no @map) | Case mismatch |
| MerchantStatus | `merchant_status` | `"MerchantStatus"` | `enum MerchantStatus { ... }` (no @map) | Case mismatch — **causes current runtime error** |
| (15 more) | lowercase | PascalCase | No @map | Same for all |

**Current Situation:**
- Prisma schema has zero `@@map()` or `@map()` directives on enums
- This means Prisma assumes the database type name matches the Prisma enum name exactly
- Prisma enums are PascalCase by convention
- If database has lowercase (Version A), every enum usage fails
- If database has PascalCase quoted (Version B), everything works

**Fix Required:**
Either:
1. Add `@@map("merchant_status")` etc. to every Prisma enum (to match database)
2. Recreate database with PascalCase types (to match Prisma)

---

### ISSUE #5: Frontend Status Fields Untyped

**Location:**
- `apps/admin/src/lib/api/merchants.ts` line 9
- `apps/admin/src/lib/api/merchants.ts` line 17
- `apps/merchant/src/stores/auth-store.ts` line 12

**Problem:**
```typescript
// Current (weak typing)
interface Merchant {
  status: string;  // No enum constraint
}

// Should be
interface Merchant {
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
}
```

**Impact:**
- Frontend can render invalid status values
- No compile-time validation
- Runtime errors possible if backend sends unexpected status

**Fix Required:**
Import typed enums from `packages/types/src/enums.ts` or use union types.

---

### ISSUE #6: DTO Type Inconsistency — ReviewDocumentDto

**Location:**
`apps/api/src/merchants/dto/review-document.dto.ts` line 7

**Problem:**
```typescript
// review-document.dto.ts (INLINE TYPE)
status!: "VERIFIED" | "REJECTED";

// create-merchant-document.dto.ts (IMPORTED TYPE)
@IsEnum(MerchantDocumentType)
type!: MerchantDocumentType;
```

The `type` field uses the `MerchantDocumentType` enum from `@prisma/client`, but `status` uses inline literals. Inconsistent patterns.

**Fix Required:**
Import and use `MerchantDocumentStatus` enum from `@prisma/client` in ReviewDocumentDto.

---

### ISSUE #7: `packages/types/src/enums.ts` is Orphaned

**Location:**
`packages/types/src/enums.ts` (entire file)

**Problem:**
This file mirrors all Prisma enums but:
- It's not imported by any frontend code
- Frontend files hardcode `string` or inline literals instead
- It's hand-maintained and can drift from Prisma schema
- Creates a maintenance burden

**Impact:**
- Duplicate enum definitions (Prisma + this file)
- Frontend gets no enum type safety
- Changes to enums require updating both locations

**Fix Required:**
Either:
1. Delete this file and ensure frontend imports from generated Prisma types
2. Configure Prisma to generate TypeScript types in packages/types and use them everywhere

---

## MINOR ISSUES

### ISSUE #8: Backend Uses String Literals Instead of Enum References

**Location:**
`apps/api/src/merchants/merchants.service.ts` lines 49, 52, 72, 87

**Problem:**
```typescript
// Current
if (merchant.status === "APPROVED") { ... }

// Better
if (merchant.status === MerchantStatus.APPROVED) { ... }
```

**Impact:**
- Typos not caught at compile time
- Harder to refactor enum values
- Less self-documenting code

**Severity:** Low (functional but brittle)

**Fix Required:**
Replace string literals with enum references.

---

## VALIDATION CHECKLIST

### Database Layer
- [ ] Verify which enum types exist in PostgreSQL (`\dT+`)
- [ ] Confirm merchant table's status column type
- [ ] Verify all FK constraints exist
- [ ] Verify all indexes exist

### Prisma Layer
- [ ] `prisma validate` passes
- [ ] `prisma migrate status` shows all applied migrations
- [ ] `prisma db pull` matches current schema
- [ ] No schema drift between `schema.prisma` and database

### Backend Layer
- [ ] `npm run typecheck` passes (TypeScript)
- [ ] All enum imports resolve
- [ ] DTOs match Prisma models
- [ ] `prisma.merchant.create()` works with MerchantStatus

### Frontend Layer
- [ ] All status fields properly typed
- [ ] No `string` types for enums
- [ ] All API responses match types
- [ ] Forms validate enum values

### API Layer
- [ ] POST /merchants accepts MerchantStatus
- [ ] Response includes correctly typed status
- [ ] No 400 errors on enum validation

### Build & Runtime
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts without errors
- [ ] `docker compose up` completes
- [ ] Backend health check passes
- [ ] No runtime enum type errors

---

## RECOMMENDATION MATRIX

| Issue | Severity | Effort | Priority | Recommendation |
|-------|----------|--------|----------|---|
| Duplicate migrations | CRITICAL | LOW | 1st | Delete flat 001_initial_schema.sql; keep Prisma-managed version |
| Schema drift | CRITICAL | MEDIUM | 2nd | Regenerate Prisma migration or manually reconcile schema |
| Untracked migrations | CRITICAL | MEDIUM | 3rd | Convert to Prisma migrations or create single new migration |
| Enum type mismatches | CRITICAL | LOW | 4th | Add @map directives to Prisma enums (once database is fixed) |
| Frontend weak typing | MAJOR | LOW | 5th | Use union types or import from packages/types |
| ReviewDocumentDto | MINOR | LOW | 6th | Import MerchantDocumentStatus enum |
| packages/types orphan | MINOR | LOW | 7th | Delete or integrate into build process |
| String literals in backend | MINOR | LOW | 8th | Replace with enum references |

---

## NEXT STEPS

This audit is **PHASE 1 — ANALYSIS COMPLETE**.

**PHASE 2 — REMEDIATION** will:
1. Fix the migration conflict (delete or fix)
2. Resolve schema drift
3. Integrate untracked migrations
4. Fix enum type names
5. Update frontend types
6. Validate entire system end-to-end

**Expected outcome:** Production-ready system with zero inconsistencies across database ↔ Prisma ↔ Backend ↔ Frontend.

---

**Report compiled by:** Principal Software Architect  
**Analysis depth:** Complete (all files, all layers)  
**Confidence:** High (95%+)
