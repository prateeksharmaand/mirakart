# Mirakart

Production multi-vendor ecommerce platform: public website, master admin
(RBAC sub-admins), merchant portal, customer mobile app, and a NestJS
backend — all sharing one PostgreSQL database and one design system
(ported from the Clotya theme reference).

Architecture, schema, API contracts, and UI route trees are documented in
[`docs/`](docs/) — start with [`docs/architecture.md`](docs/architecture.md).
No business modules are implemented yet; this repo currently contains the
architecture, database schema, API contracts, folder structure, and Docker
scaffolding (see `docs/architecture.md` → "Module build order" for what's
next and in what sequence).

## Stack

NestJS · Prisma · PostgreSQL · Redis · BullMQ · Next.js · Tailwind ·
TanStack Query · Zustand · Flutter (Riverpod) · MinIO · Docker Compose ·
Nginx. Full rationale in [`docs/architecture.md`](docs/architecture.md).

## Local development

Requires Node 20+, pnpm 9+, and Docker (for Postgres/Redis/MinIO).

```bash
cp .env.example .env   # fill in local values
pnpm install

# Start just the data services
docker compose up -d postgres redis minio minio-init

pnpm --filter @mirakart/api db:migrate
pnpm dev   # runs all apps in parallel via Turborepo
```

| App | URL |
|---|---|
| Public website | http://localhost:3000 |
| Master admin | http://localhost:3001 |
| Merchant portal | http://localhost:3002 |
| API + Swagger | http://localhost:4000/api/docs |
| MinIO console | http://localhost:9001 |

Flutter app: `cd mobile && flutter pub get && flutter run`.

## Full stack via Docker Compose

```bash
docker compose up --build
```

For VPS deployment, see [`docs/deployment.md`](docs/deployment.md).

## Common scripts (root, via Turborepo)

```bash
pnpm build       # build all apps/packages
pnpm lint        # lint all apps/packages
pnpm typecheck   # typecheck all apps/packages
pnpm test        # test all apps/packages
```

## Repository layout

See [`docs/architecture.md`](docs/architecture.md) for the full breakdown.
