# API Contracts

Base URL: `https://api.mirakart.com/api/v1` (local: `http://localhost:4000/api/v1`)

This document is the contract reference for what each backend module exposes.
It is intentionally an endpoint catalog, not a full OpenAPI spec — Swagger
(generated from the NestJS decorators at `/api/docs`) is the executable
source of truth. Update this file whenever a module's contract changes; do
not let it drift from Swagger.

**Status**: all 14 modules below are implemented — see
`docs/architecture.md` → "Module build order" for the per-module summary
and any contract refinements made during implementation (a few endpoints
ended up slightly different from this doc's first draft; those are called
out inline below and in architecture.md).

## Conventions

- **Versioning**: URI-based (`/api/v1/...`), via Nest's `VersioningType.URI`.
- **Media references**: anywhere a response includes an image/logo/banner
  relation (Product images, Category icon/banner, Brand logo, Merchant
  logo/banner, platform Banners), it's the full `Media` object (`{ id, url,
  mimeType, ... }`), not a bare `mediaId` — every list/detail query joins
  the `media` relation specifically so the frontend always has a renderable
  `url` without a second round-trip.
- **Auth**: `Authorization: Bearer <accessToken>`. Three independent token
  spaces (Admin, Merchant, Customer) — a token issued for one principal type
  is not valid against another principal's guard.
- **Response envelope** (see `packages/types/src/api.ts`) — applied globally
  by `ResponseInterceptor` + `HttpExceptionFilter`
  (`apps/api/src/common/{interceptors,filters}/`), not per-controller:
  ```json
  { "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "totalItems": 134, "totalPages": 7 } }
  { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "details": { "email": ["email must be a valid email"] } } }
  ```
- **Pagination**: query params `page` (default 1), `limit` (default 20, max 100). `sortBy`/`sortOrder` (`asc`|`desc`) are supported on the entity-management admin-table endpoints (Admin Users, Roles-adjacent Permissions, Merchants, Customers, Products — all three list variants, Admin Orders, Admin Returns) via `apps/api/src/common/utils/sort.util.ts`'s `buildOrderBy`, which restricts `sortBy` to a per-entity field allowlist (never passed to Prisma raw). Personal-history lists (`/orders`, `/merchants/me/orders`, `/returns`, `/merchants/me/returns`, `/notifications`) are fixed `createdAt desc` by design — there's no second sort axis a customer/merchant viewing their own history needs.
- **Filtering**: module-specific query params, documented per endpoint group below.
- **Errors**: standard HTTP status codes; `error.code` is derived from the
  HTTP status (`NOT_FOUND`, `CONFLICT`, `FORBIDDEN`, `UNAUTHORIZED`,
  `BAD_REQUEST`, `TOO_MANY_REQUESTS`) or `VALIDATION_ERROR` for
  `ValidationPipe` failures (with field-level `details`) — not a bespoke
  per-business-rule code catalog (e.g. no dedicated `INSUFFICIENT_STOCK`
  code; that case is a `400 BAD_REQUEST`/`409 CONFLICT` with a descriptive
  message instead).
- **Idempotency**: not implemented. Order placement and other mutating
  endpoints do not currently support an `Idempotency-Key` header — a
  double-submitted checkout request creates two orders. Worth adding before
  this goes to production traffic.
- **Rate limiting**: 120 req/min per IP at the gateway (Nest Throttler), tightened to 20 req/min at the Nginx layer for unauthenticated endpoints. Auth login/register/reset endpoints have additional per-route throttling (5-10 req/min).

## Auth (`/auth`)

**Implemented** — see `apps/api/src/auth/`. Three independent JWT principal
spaces (Admin/Merchant/Customer) share one `/auth/*` token lifecycle but
authenticate against separate tables; a token's `type` claim is checked by
`PrincipalAuthGuard` against each route's `@AdminAuth()`/`@MerchantAuth()`/
`@CustomerAuth()` decorator, so an Admin token can never call a Merchant route.

| Method | Path | Principal | Description |
|---|---|---|---|
| POST | `/auth/admin/login` | Admin | Email + password → access/refresh token pair. Blocked (403) unless `status: ACTIVE` |
| POST | `/auth/merchant/register` | Public | Merchant self-registration → `status: PENDING`, store slug auto-generated/disambiguated from `storeName`. Logs the merchant in immediately |
| POST | `/auth/merchant/login` | Merchant | **Refined during implementation**: succeeds for any status except `SUSPENDED` (403) — `PENDING`/`REJECTED` merchants can log in and see the `/pending-approval` page; downstream business endpoints enforce `APPROVED` themselves |
| POST | `/auth/customer/register` | Public | Customer sign-up |
| POST | `/auth/customer/login` | Customer | Blocked (403) unless `status: ACTIVE` |
| POST | `/auth/refresh` | Any | Body: `{ refreshToken }`. Opaque, DB-backed, single-use (rotates on every call); revoked tokens and tokens for since-deactivated accounts are rejected |
| POST | `/auth/logout` | Any | Body: `{ refreshToken }`. Revokes just that token/device |
| POST | `/auth/forgot-password` | Any | **Refined during implementation**: body is `{ email, principalType }`, not `email` alone — email is unique per-table, not globally, so the principal space must be explicit. Always responds 204 whether or not the account exists (avoids account enumeration) |
| POST | `/auth/reset-password` | Any | Body: `{ token, principalType, newPassword }`. Single-use, 30-minute-lived token; revokes all of that principal's existing sessions on success |

## Users / Roles / Permissions (`/admin-users`, `/roles`, `/permissions`)

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/admin-users/me` | None (any active admin) | Own profile |
| GET | `/admin-users` | `admin_user.view` | Paginated list, filter by `status`, `roleId`, `search` |
| POST | `/admin-users` | `admin_user.create` | Create sub-admin, assign role; `isSuperAdmin` is not settable via API |
| GET | `/admin-users/:id` | `admin_user.view` | |
| PATCH | `/admin-users/:id` | `admin_user.edit` | Can't deactivate your own account |
| DELETE | `/admin-users/:id` | `admin_user.delete` | Soft delete; can't delete your own account |
| GET | `/roles` | `role.view` | |
| POST | `/roles` | `role.create` | `{ name, description, permissionIds[] }` |
| PATCH | `/roles/:id` | `role.edit` | |
| DELETE | `/roles/:id` | `role.delete` | Blocked if `isSystem` |
| GET | `/permissions` | `role.view` | Full permission catalog, grouped by module |

## Merchants (`/merchants`)

| Method | Path | Principal | Description |
|---|---|---|---|
| GET | `/merchants` | Admin (`merchant.view`) | Filter by `status`, search by `storeName`/`email` |
| GET | `/merchants/:id` | Admin only | Merchants use `/merchants/me`, not their own id, below |
| PATCH | `/merchants/:id/approve` | Admin (`merchant.approve`) | From `PENDING`/`REJECTED` → `APPROVED` |
| PATCH | `/merchants/:id/reject` | Admin (`merchant.reject`) | `{ rejectionReason }`, only from `PENDING` |
| PATCH | `/merchants/:id/suspend` | Admin (`merchant.edit`) | Only from `APPROVED` |
| GET | `/merchants/me` | Merchant | Own store profile |
| PATCH | `/merchants/me` | Merchant | Update store profile, logo, banner |
| GET | `/merchants/me/documents` | Merchant | |
| POST | `/merchants/me/documents` | Merchant | `{ mediaId, type }` |
| GET | `/merchants/:id/documents` | Admin (`merchant.view`) | |
| PATCH | `/merchants/:id/documents/:docId` | Admin (`merchant.approve`) | `{ status: VERIFIED \| REJECTED }` |

## Customers (`/customers`)

| Method | Path | Principal | Description |
|---|---|---|---|
| GET | `/customers` | Admin (`customer.view`) | Search/filter by status |
| GET | `/customers/:id` | Admin (`customer.view`) | |
| PATCH | `/customers/:id/block` | Admin (`customer.edit`) | |
| GET | `/customers/me` | Customer | Own profile |
| PATCH | `/customers/me` | Customer | |
| GET | `/customers/me/addresses` | Customer | |
| POST | `/customers/me/addresses` | Customer | |
| PATCH | `/customers/me/addresses/:id` | Customer | |
| DELETE | `/customers/me/addresses/:id` | Customer | |

## Categories (`/categories`)

**Refined during implementation**: no Redis caching layer yet (plain
Postgres queries) — that's a deferred performance optimization, not a
correctness gap. Added `GET /categories/admin/all` (admin, `category.view`)
returning the flat list including inactive categories, for the master
admin's category management table.

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/categories` | Public | Tree or flat (`?flat=true`); active categories only |
| GET | `/categories/:slug` | Public | |
| POST | `/categories` | Admin (`category.create`) | |
| PATCH | `/categories/:id` | Admin (`category.edit`) | |
| DELETE | `/categories/:id` | Admin (`category.delete`) | Soft delete; blocked if it has subcategories or active products |

## Brands (`/brands`)

Same CRUD shape as Categories, including the `GET /brands/admin/all` admin-all-statuses variant: `GET /brands` (public, active only), `GET /brands/:slug`, `POST|PATCH|DELETE /brands[/:id]` (admin, `brand.*`). Delete blocked while referenced by active products.

## Attributes (`/attributes`)

**Refined during implementation**: `GET` endpoints made fully public (not
Admin/Merchant-gated) — the public storefront needs to read attributes to
render "Size / Color" filter UI on category pages, matching the
Categories/Brands precedent.

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/attributes` | Public | With nested `values[]` |
| GET | `/attributes/:id` | Public | |
| POST | `/attributes` | Admin (`attribute.create`) | `{ name, type, values: [{ value, colorHex? }] }` |
| PATCH | `/attributes/:id` | Admin (`attribute.edit`) | Name/type only — see below for values |
| DELETE | `/attributes/:id` | Admin (`attribute.delete`) | Blocked if used by any product |
| POST | `/attributes/:id/values` | Admin (`attribute.edit`) | Add a value |
| DELETE | `/attributes/:id/values/:valueId` | Admin (`attribute.edit`) | Blocked if used by any product variant |

## Products (`/products`)

**Refined during implementation**: `isFeatured` is intentionally excluded
from the merchant's own `PATCH` body — a merchant self-granting "featured"
placement is an editorial decision, not theirs to make — and instead has a
dedicated admin-only endpoint. Faceted attribute filtering uses
AND-combined `attributeValueIds` (resolved client-side from `attrSlug=value`
against the Attributes catalog), not raw `attrSlug=value` query pairs.
Public listing only ever returns products with at least one active
variant (an `APPROVED` product with zero variants isn't purchasable, so
it's excluded).

| Method | Path | Principal | Description |
|---|---|---|---|
| GET | `/products` | Public | Filter: `categoryId`, `brandId`, `minPrice`, `maxPrice`, `attributeValueIds` (comma-separated, AND), `search`, `isFeatured` |
| GET | `/products/:slug` | Public | Full detail incl. variants, images, inventory-availability flag |
| GET | `/merchants/me/products` | Merchant | Own catalog, any status |
| GET | `/merchants/me/products/:id` | Merchant | |
| POST | `/merchants/me/products` | Merchant | Creates as `DRAFT` or `PENDING_APPROVAL` |
| PATCH | `/merchants/me/products/:id` | Merchant | Re-submits to `PENDING_APPROVAL` if previously `REJECTED` |
| DELETE | `/merchants/me/products/:id` | Merchant | Soft delete |
| GET | `/admin/products` | Admin (`product.view`) | Filter by `status`, `merchantId` |
| GET | `/admin/products/:id` | Admin (`product.view`) | |
| PATCH | `/admin/products/:id/approve` | Admin (`product.approve`) | Only from `PENDING_APPROVAL` |
| PATCH | `/admin/products/:id/reject` | Admin (`product.reject`) | `{ rejectionReason }`, only from `PENDING_APPROVAL` |
| PATCH | `/admin/products/:id/featured` | Admin (`product.edit`) | `{ isFeatured }` |
| POST | `/merchants/me/products/:id/variants` | Merchant | `{ sku, price, attributeValueIds[] }` |
| PATCH | `/merchants/me/products/:id/variants/:variantId` | Merchant | |
| DELETE | `/merchants/me/products/:id/variants/:variantId` | Merchant | |
| PATCH | `/merchants/me/products/:id/variants/:variantId/inventory` | Merchant | `{ quantity, lowStockThreshold }` |
| POST | `/merchants/me/products/:id/images` | Merchant | `{ mediaId, variantId?, isPrimary? }` |
| DELETE | `/merchants/me/products/:id/images/:imageId` | Merchant | |

## Cart (`/cart`)

| Method | Path | Principal | Description |
|---|---|---|---|
| GET | `/cart` | Customer | Current cart with live price/stock validation |
| POST | `/cart/items` | Customer | `{ variantId, quantity }` |
| PATCH | `/cart/items/:itemId` | Customer | Update quantity |
| DELETE | `/cart/items/:itemId` | Customer | |
| DELETE | `/cart` | Customer | Clear cart |

## Orders (`/orders`)

**Refined during implementation**: `shippingFee`/`tax`/`discount` default
to `0` — there's no shipping-rate or tax-calculation engine in scope yet
(see Project Goal exclusions), so `total` currently equals `subtotal`.
Inventory is decremented inside the checkout transaction via a conditional
`updateMany` (only succeeds if stock is still sufficient at commit time),
not a blind decrement — this is what actually prevents two concurrent
checkouts from overselling the same unit of stock; a naive pre-check +
decrement would not. Merchant's own-order detail is `GET
/merchants/me/orders/:id`, not a shared `/orders/:id` (which is
customer-only) — it returns only that merchant's `OrderItem`s, not other
merchants' items/pricing within the same multi-vendor order. Admin's is
`GET /admin/orders/:id`.

| Method | Path | Principal | Description |
|---|---|---|---|
| POST | `/orders/checkout` | Customer | `{ shippingAddressId, billingAddressId, paymentMethod }` → creates Order + Payment, splits `OrderItem`s by merchant |
| GET | `/orders` | Customer | Own order history |
| GET | `/orders/:id` | Customer | |
| GET | `/orders/:id/tracking` | Customer | Status timeline from `OrderStatusHistory` |
| PATCH | `/orders/:orderId/items/:itemId/status` | Merchant (own items) / Admin | Per-item status transition (e.g. → `SHIPPED`) |
| GET | `/admin/orders` | Admin (`order.view`) | Filter by `status`, `customerId` |
| GET | `/admin/orders/:id` | Admin (`order.view`) | |
| PATCH | `/admin/orders/:id/status` | Admin (`order.edit`) | Order-level override, `{ status, note? }` |
| GET | `/merchants/me/orders` | Merchant | Orders containing the merchant's items |
| GET | `/merchants/me/orders/:id` | Merchant | Own items only (see above) |

## Payments (`/payments`)

Provider: Razorpay (`apps/api/src/payments/razorpay.service.ts`), per the
`PAYMENT_PROVIDER`/`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` env vars already
in `.env.example`. The webhook needs the exact raw request bytes to verify
its HMAC signature, which standard JSON body-parsing discards — `main.ts`
enables Nest's `rawBody: true` option specifically for this. Webhook
handling is idempotent (a repeat delivery for an already-resolved payment
is a no-op) and silently ignores webhooks for provider order ids it
doesn't recognize (logs a warning, doesn't error — avoids the provider
retrying forever on data it can't reconcile).

| Method | Path | Principal | Description |
|---|---|---|---|
| POST | `/payments/:orderId/initiate` | Customer | Creates a Razorpay order; returns `{ provider, keyId, providerOrderId, amount, currency }` for the client to open Razorpay Checkout. Rejected for `COD` orders and for orders already paid |
| POST | `/payments/webhook` | Public (HMAC-verified) | `payment.captured` → `Payment.status=CAPTURED`, `Order.status=CONFIRMED`. `payment.failed` → `Payment.status=FAILED` |
| GET | `/payments/:orderId` | Customer (own) / Admin | |

## Returns (`/returns`)

**Refined during implementation**: `/returns/:id` is customer-only (not a
shared cross-principal route); merchant and admin each have their own
detail route under their own prefix, same pattern as Orders. Returns are
only creatable for `DELIVERED` order items, and only one active (non
REJECTED/CANCELLED/COMPLETED) return is allowed per order item at a time.
A return can only be approved/rejected from `REQUESTED`/`UNDER_REVIEW`;
`ITEM_RECEIVED` only follows `AWAITING_SHIPMENT`, `COMPLETED` only follows
`ITEM_RECEIVED` — merchants can't skip steps. There is no RBAC permission
gate on the merchant actions below (`return.approve`/`return.reject` in
the original draft) — merchants aren't role/permission-scoped the way
sub-admins are, every merchant manages their own store's returns fully.

| Method | Path | Principal | Description |
|---|---|---|---|
| GET | `/return-reasons` | Public | Active reasons list |
| POST | `/returns` | Customer | `{ orderItemId, reasonId, reasonDetail?, quantity, imageMediaIds[] }` → `REQUESTED` |
| GET | `/returns` | Customer | Own returns |
| GET | `/returns/:id` | Customer | Incl. status history |
| PATCH | `/returns/:id/cancel` | Customer | Only while `REQUESTED` or `UNDER_REVIEW` |
| GET | `/merchants/me/returns` | Merchant | |
| GET | `/merchants/me/returns/:id` | Merchant | Own returns only |
| PATCH | `/merchants/me/returns/:id/approve` | Merchant | → `AWAITING_SHIPMENT` |
| PATCH | `/merchants/me/returns/:id/reject` | Merchant | `{ note }` |
| PATCH | `/merchants/me/returns/:id/status` | Merchant | `{ status: ITEM_RECEIVED \| COMPLETED }`, sequential only |
| GET | `/admin/returns` | Admin (`return.view`) | All returns, filter by `status`, `merchantId` |
| GET | `/admin/returns/:id` | Admin (`return.view`) | |
| PATCH | `/admin/returns/:id/status` | Admin (`return.edit`) | Override to any status, `{ status, note?, refundAmount? }` — refund amount is recorded only, not actually processed (Automatic Refund Processing is explicitly out of scope) |

## Notifications (`/notifications`)

**Implemented**: in-app CRUD + FCM device-token registration, for all
three principal types (not customer-only — an admin or merchant logged
into a future mobile/push-enabled surface can register a token too).
**Not implemented**: `NotificationsService.create()` exists and is ready
to be called, but nothing yet calls it — Merchants/Products/Orders/Returns
don't fire a notification on approval, status change, etc. Actual FCM push
dispatch (via `firebase-admin`) is also not built; device tokens are
stored but nothing sends to them yet. Both are scoped follow-up work, not
done in this pass.

| Method | Path | Principal | Description |
|---|---|---|---|
| GET | `/notifications` | Any authenticated | Own notifications, `?unreadOnly=true`; response `meta` includes `unreadCount` |
| PATCH | `/notifications/:id/read` | Any authenticated | |
| PATCH | `/notifications/read-all` | Any authenticated | |
| POST | `/notifications/device-tokens` | Any authenticated | Registers/refreshes an FCM token |

## Settings (`/admin/settings`)

Generic key-value store, not a predefined settings catalog — no specific
keys (`general.siteName`, `payment.codEnabled`, etc.) are seeded or
hardcoded. `group` is required only when creating a brand-new key; updates
to an existing key reuse its stored group.

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/admin/settings?group=` | Admin (`setting.view`) | Optional group filter |
| PATCH | `/admin/settings/:key` | Admin (`setting.edit`) | `{ value, group? }` — upsert; `group` required on first creation |

## Banners (`/banners`)

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/banners?position=` | Public | Active, date-windowed banners for a placement |
| POST | `/admin/banners` | Admin (`banner.create`) | |
| PATCH | `/admin/banners/:id` | Admin (`banner.edit`) | |
| DELETE | `/admin/banners/:id` | Admin (`banner.delete`) | |

## File Upload (`/uploads`)

| Method | Path | Principal | Description |
|---|---|---|---|
| POST | `/uploads` | Any authenticated | `multipart/form-data`, `{ file, purpose }` → uploads to the MinIO bucket matching `purpose` (`product-images`\|`merchant-documents`\|`return-images`\|`store-assets`\|`banners`), returns a `Media` record |
| DELETE | `/uploads/:mediaId` | Owner / Admin | Only if unreferenced |

## Reports (Master Admin & Merchant "Basic Reports")

`top-products` is exposed for merchants too (not just admin) — the
underlying query already supports merchant-scoping, so it cost nothing
extra to expose. Both endpoints take optional `dateFrom`/`dateTo` (ISO
date strings); `top-products` also takes `limit` (default 10, max 50).

| Method | Path | Principal | Description |
|---|---|---|---|
| GET | `/admin/reports/sales-summary` | Admin (`report.view`) | Date-range totals: orders, revenue, returns |
| GET | `/admin/reports/top-products` | Admin (`report.view`) | Units sold + revenue per product, ranked |
| GET | `/merchants/me/reports/sales-summary` | Merchant | Own-store equivalent |
| GET | `/merchants/me/reports/top-products` | Merchant | Own-store equivalent |
