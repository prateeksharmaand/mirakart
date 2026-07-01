# Mirakart — Architecture

Multi-vendor ecommerce platform: public website, master admin (with RBAC
sub-admins), merchant portal, customer mobile app, and a NestJS backend,
all sharing one PostgreSQL database and one visual design system.

## Decisions on record

These were resolved explicitly before any module implementation started —
recorded here so later work doesn't re-litigate them.

1. **Theme strategy.** The supplied theme reference (`themereference/`) is
   **Clotya**, a WordPress/WooCommerce/Dokan/MultiVendorX theme (Bootstrap +
   SCSS, PHP templates) — not React components. Since the stack is
   NestJS/Next.js/Flutter, "reuse the theme" means: extract Clotya's design
   tokens (colors, type scale, spacing, radii, shadows, button/form/card
   patterns — see the extraction in `packages/config/tailwind-preset.ts`)
   and rebuild matching components in Tailwind/Radix (`packages/ui`) and
   Flutter (`mobile/lib/core/theme/app_theme.dart`). The two token files
   must be kept in sync by hand; there is no automated source-of-truth
   pipeline between them.
2. **Scope exclusions** (explicitly out of scope for this version): Wallet,
   Loyalty Points, Coupons, Flash Sales, Referral Program, Blog/CMS,
   Advanced Analytics, Multi-Warehouse inventory, Automatic Refund
   Processing, Exchange Orders. Don't add hooks/columns/endpoints for these
   speculatively.
3. **One module at a time.** This repo currently contains architecture,
   schema, contracts, and scaffolding only — no business modules are
   implemented yet (see `apps/api/src/app.module.ts` for the registration
   point each new module gets added to). Each module (Controller, Service,
   Repository, DTOs, Prisma usage, tests, Swagger docs) must be completed
   before the next one starts.

## Monorepo layout

```
mirakart/
├── apps/
│   ├── web/          Next.js — public website            :3000
│   ├── admin/         Next.js — master admin + sub-admin RBAC :3001
│   ├── merchant/      Next.js — merchant portal            :3002
│   └── api/           NestJS — backend API                 :4000
├── mobile/            Flutter — customer app (Riverpod, Dio, GoRouter, FCM)
├── packages/
│   ├── ui/            Shared Tailwind/Radix component library (Clotya-themed)
│   ├── config/         Shared tailwind preset, tsconfig presets, eslint preset
│   └── types/          Shared enums (mirrors Prisma) + API response envelope types
├── infra/
│   ├── docker/         Per-app Dockerfiles (Turborepo-pruned multi-stage builds)
│   └── nginx/          nginx.conf + envsubst templates per domain
├── docs/                This documentation set
├── themereference/      Clotya theme source (vendor reference only, not shipped)
├── docker-compose.yml          Base/dev stack: postgres, redis, minio, api, web, admin, merchant, nginx
├── docker-compose.prod.yml     Production overrides (no exposed DB/Redis/MinIO ports, certbot renewal)
└── .env.example
```

Package manager: **pnpm** workspaces, orchestrated by **Turborepo**
(`turbo.json`) for cached, parallelized `build`/`lint`/`typecheck`/`test`
across all apps and packages.

## Backend: modular monolith

`apps/api` is a single NestJS deployable, organized as one Nest module per
business capability (not microservices — see Project Goal). Each module
under `apps/api/src/<module>/` will contain:

```
<module>/
├── <module>.module.ts
├── <module>.controller.ts
├── <module>.service.ts
├── <module>.repository.ts     # Prisma queries isolated from service logic
├── dto/
│   ├── create-<x>.dto.ts
│   └── update-<x>.dto.ts
└── <module>.service.spec.ts
```

`PrismaService` (`apps/api/src/prisma/`) is global and injected into every
repository. Soft-deletable models (see `schema.prisma` header comment)
must filter `deletedAt: null` in the repository, not the controller.

Module build order. All 14 modules below are now implemented (the
dependency chain was Auth → Catalog → Products → Cart → Orders; File
Upload was moved earlier than its original position, ahead of Merchants,
since merchant document verification and product images both need it):

1. ✅ Auth — `apps/api/src/auth/`. Login/register/refresh/logout/forgot-reset-password for all three principal types; per-principal-type JWT guards (`@AdminAuth()`/`@MerchantAuth()`/`@CustomerAuth()`).
2. ✅ RBAC (`apps/api/src/auth/rbac.module.ts`, `@Global()`) + Admin Users / Roles / Permissions — `@RequirePermission(code)` enforcement via `@AdminAuth(code)`; permission catalog seeded in `prisma/seed.ts`.
3. ✅ File Upload (MinIO) — `apps/api/src/uploads/` + `apps/api/src/storage/`. Generic `POST /uploads` with a `purpose` → bucket/mime/size-limit/principal-type map; presigned URLs for private buckets, permanent URLs for public ones.
4. ✅ Merchants — approval workflow (`PENDING→APPROVED/REJECTED/SUSPENDED`), documents, self-service profile.
5. ✅ Customers — profile, addresses (single-default-address invariant enforced transactionally).
6. ✅ Categories / Brands / Attributes — public read, admin-managed; delete blocked while referenced by active products/variants.
7. ✅ Products — variants, images, inventory, approval workflow, public faceted search (price range + AND-combined attribute filters).
8. ✅ Cart — live stock/price/availability validation against current variant state, not the stored snapshot.
9. ✅ Orders — checkout splits one cart into one `Order` with per-(merchant,variant) `OrderItem`s; inventory decremented via a conditional `updateMany` inside the transaction (not a blind decrement) so concurrent checkouts can't oversell.
10. ✅ Payments — Razorpay order creation + HMAC-verified webhook (`rawBody: true` in `main.ts`); idempotent on repeat webhook delivery.
11. ✅ Returns — reasons catalog, customer request → merchant approve/reject → ship → receive → complete state machine, admin override.
12. ✅ Notifications — in-app CRUD (list/read/read-all) + FCM `DeviceToken` registration. `NotificationsService.create()` is exposed for other modules to call but **is not yet wired into** Merchants/Products/Orders/Returns' status-change paths — that cross-module wiring, and actual FCM push dispatch via firebase-admin, are follow-up work, not done in this pass.
13. ✅ Settings / Banners — generic key-value settings (group required only on first creation of a key); date-windowed banners by placement.
14. ✅ Reports — admin + merchant sales summary and top-products, date-range filtered. No predefined Setting keys are seeded; "basic" per Project Goal, not the excluded "Advanced Analytics".

Every module was validated the same way: `tsc --noEmit`, `eslint`, the
module's unit tests, a full `nest build`, and a boot test confirming the
Nest DI graph resolves end-to-end (it fails only at `PrismaService`
reaching a real Postgres, which this dev sandbox doesn't have running).

## Frontend apps

All three Next.js apps share `@mirakart/ui` and `@mirakart/types`, use
TanStack Query for server state, Zustand for local UI state, React Hook
Form + Zod for forms. Route trees are in `docs/ui-page-hierarchy.md`.

## Data flow / integration

- **Auth**: three independent JWT principal spaces (Admin, Merchant,
  Customer) sharing the same `RefreshToken` table, disambiguated by
  `principalType`. See the no-DB-FK note in `schema.prisma` for why
  `principalId` is intentionally unconstrained at the DB level.
- **Media**: binaries go to MinIO; Postgres only stores the `Media` row
  (bucket, object key, URL, mime type). Five buckets, provisioned by the
  `minio-init` one-shot service in `docker-compose.yml`: product-images,
  merchant-documents, return-images, store-assets, banners.
- **Cache**: Redis backs both BullMQ (background jobs — emails, FCM push,
  webhook processing) and ad-hoc read-through caching (category tree,
  active banners).
- **RBAC**: `Role` ←→ `Permission` many-to-many via `RolePermission`.
  Permission codes are `<module>.<action>` (e.g. `product.approve`); the
  seven actions are fixed per the Project Goal (View, Create, Edit, Delete,
  Approve, Reject, Export). `AdminUser.isSuperAdmin` bypasses the
  permission check entirely (master admin).

## Further reading

- `docs/database.md` — schema walkthrough (source of truth: `apps/api/prisma/schema.prisma`)
- `docs/api-contracts.md` — endpoint catalog and conventions
- `docs/ui-page-hierarchy.md` — route trees for all four client surfaces
- `docs/deployment.md` — Ubuntu VPS deployment guide
