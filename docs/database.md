# Database

Source of truth: [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma).
This document is a guided walkthrough, not a duplicate of the schema — when
the two disagree, the schema file wins; update this doc in the same commit
that changes it.

PostgreSQL 16. Primary keys are `cuid()` strings throughout (sortable,
collision-resistant, generated app-side — no round-trip needed to get an
ID before relating rows in the same transaction).

## Entity groups

| Group | Models | Notes |
|---|---|---|
| Auth / RBAC | `AdminUser`, `Role`, `Permission`, `RolePermission`, `RefreshToken` | `RefreshToken.principalId` is polymorphic (Admin\|Merchant\|Customer) — see schema comment |
| Merchants | `Merchant`, `MerchantDocument` | `Merchant.status` drives the approval workflow |
| Customers | `Customer`, `Address` | |
| Catalog | `Category` (self-referencing tree), `Brand`, `Attribute`, `AttributeValue`, `Product`, `ProductAttribute`, `ProductImage`, `ProductVariant`, `ProductVariantAttributeValue`, `Inventory` | A `Product` is the merchandising entity (name, description, approval); a `ProductVariant` is the sellable unit (SKU, price, stock) |
| Cart | `Cart`, `CartItem` | One cart per customer; `priceSnapshot` captures price at add-time for display, real price is re-validated at checkout |
| Orders | `Order`, `OrderItem`, `OrderStatusHistory`, `Payment` | An `Order` fans out into one `OrderItem` per (merchant, variant) pair — multi-vendor checkout splits a single cart into per-merchant fulfillment lines while keeping one `Order`/one `Payment` for the customer |
| Returns | `ReturnReason`, `Return`, `ReturnImage`, `ReturnStatusHistory` | One `Return` per `OrderItem`; `ReturnStatusHistory.changedById` is polymorphic (Customer\|Merchant\|AdminUser) per `changedByType` |
| Notifications | `Notification` | Three nullable recipient FKs (`customerId`/`merchantId`/`adminUserId`), exactly one populated per `recipientType` |
| Platform | `Setting`, `Media`, `Banner`, `AuditLog` | `Media` stores MinIO object paths only — see `docs/architecture.md` "Media" |

## Conventions

- **Audit columns**: `createdAt`/`updatedAt` on every mutable model.
  Workflow transitions that need a named actor use an explicit relation
  (`Product.approvedById`, `Merchant.approvedById`) rather than a generic
  `updatedById`, because `AuditLog` already covers generic actor/action
  history — duplicating that on every table would be redundant.
- **Soft deletes**: `deletedAt` on models that historical records (orders,
  returns, audit log) can still point to after deletion — `AdminUser`,
  `Merchant`, `Customer`, `Category`, `Brand`, `Product`, `ProductVariant`,
  `Order`. Prisma has no native soft-delete; repositories must filter
  `deletedAt: null` explicitly on default reads (see `docs/architecture.md`
  → Backend repository pattern).
- **Money**: `Decimal(12,2)`. Never `Float` — avoids binary rounding error
  on currency math.
- **Polymorphic references**: two places intentionally skip a DB-level
  foreign key (`RefreshToken.principalId`, `ReturnStatusHistory.changedById`)
  because the referenced table varies by a sibling `*Type` enum column. A
  single column can't carry simultaneous FK constraints to three different
  tables — see the inline comments in `schema.prisma` at both sites.
- **Indexes**: foreign keys used in hot-path filters are explicitly
  indexed (`Product.merchantId`/`categoryId`/`status`, `Order.customerId`/
  `status`, `OrderItem.merchantId`, `Return.merchantId`/`status`,
  `Notification` per recipient type, `AuditLog.entityType+entityId`).

## Migrations & seed data

```bash
pnpm --filter @mirakart/api db:migrate       # dev: creates + applies a migration
pnpm --filter @mirakart/api db:migrate:deploy  # prod: applies pending migrations only
pnpm --filter @mirakart/api db:seed          # apps/api/prisma/seed.ts
```

Seed data (to be added alongside the Auth/RBAC and Catalog modules) must
cover: the fixed permission catalog (`<module>.<action>` rows for all 7
actions × all modules), a default Super Admin, and the `ReturnReason`
lookup list — these are reference data the app cannot function without,
not demo/sample content.

## ERD

Generate an up-to-date diagram on demand rather than committing a static
image that will drift from the schema:

```bash
pnpm --filter @mirakart/api exec prisma generate  # after adding prisma-erd-generator to schema.prisma generators
```
