# UI Page Hierarchy

Route trees for the four client surfaces. Next.js apps use the App Router
(folders under `src/app/`); route groups `(group)` don't affect the URL,
just layout nesting. Visual components for every route are ported from the
Clotya theme reference per `docs/architecture.md` → "Theme strategy".

## Public Website (`apps/web`) — `mirakart.com`

```
/                                  Homepage (hero banner, featured categories, featured products)
/c/[categorySlug]                  Category listing (filters: brand, price, attributes; pagination)
/search?q=                         Search results
/p/[productSlug]                   Product detail (gallery, variant picker, reviews-ready layout)
/cart                              Cart
/checkout                          Checkout (address → shipping → payment → review)
/checkout/confirmation/[orderId]   Order confirmation
/store/[merchantSlug]              Public merchant storefront (their products only)

/login
/register
/forgot-password
/reset-password

/account                           (auth-gated layout with sidebar)
/account/profile
/account/addresses
/account/orders
/account/orders/[orderId]          Order detail + tracking timeline
/account/returns
/account/returns/new/[orderItemId] Create return request
/account/returns/[returnId]
```

## Master Admin (`apps/admin`) — `admin.mirakart.com`

```
/login

/(dashboard)                       Authenticated shell: sidebar nav + topbar
/dashboard                         KPI cards, sales chart, recent orders/returns

/merchants
/merchants/[id]                    Profile, documents, approve/reject/suspend
/customers
/customers/[id]

/catalog/categories
/catalog/brands
/catalog/attributes
/products                          Approval queue + full catalog, filter by status/merchant
/products/[id]

/orders
/orders/[id]
/returns
/returns/[id]

/users                             Admin/sub-admin user management
/users/[id]
/roles
/roles/[id]                        Permission matrix editor

/banners
/reports
/settings                          General / Payment / Shipping tabs
```

## Merchant Portal (`apps/merchant`) — `seller.mirakart.com`

```
/login
/register
/pending-approval                  Shown while status = PENDING/REJECTED

/(dashboard)
/dashboard                         Sales KPIs, low-stock alerts, recent orders

/store-profile                     Store name, logo, banner, description, documents

/products
/products/new
/products/[id]/edit
/products/[id]/variants
/products/[id]/inventory

/orders
/orders/[id]

/returns
/returns/[id]

/reports
/settings
```

## Flutter App (`mobile`) — customer

GoRouter route tree (`mobile/lib/core/router/`), screens grouped by feature
module under `mobile/lib/features/<module>/presentation/`:

```
/splash                            Auth check → /home or /login
/login
/register
/forgot-password

/home                              Bottom-nav root: Home / Categories / Cart / Orders / Profile
/categories
/categories/:slug                  Product grid
/search
/product/:slug
/cart
/checkout
/checkout/payment
/order-confirmation/:orderId

/orders                            (Orders tab)
/orders/:orderId
/returns/new/:orderItemId
/returns/:returnId

/profile                           (Profile tab)
/profile/addresses
/profile/addresses/edit/:id?
/profile/notifications
/profile/settings
```

## Shared layout primitives (`packages/ui`)

Built once, consumed by web/admin/merchant: `AppShell` (admin/merchant
sidebar layout), `PageHeader`, `DataTable` (sort/paginate/row-actions),
`FormField` wrappers for React Hook Form, `Dialog`, `Drawer`, `Tabs`,
`Badge` (status pills mapped from the enums in `packages/types`),
`StatCard`, `EmptyState`. Each is ported from the matching Clotya markup
pattern identified in the design-token extraction (product card, form
inputs, buttons, badges, off-canvas nav) the first time a page that needs
it is implemented — not built speculatively ahead of use.
