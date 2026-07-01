# Deployment — Ubuntu VPS

Target: a single Ubuntu 22.04+ VPS running the whole stack via Docker
Compose, fronted by Nginx with Let's Encrypt SSL.

## 1. Prerequisites

- Ubuntu 22.04+ VPS, 4+ vCPU / 8GB+ RAM recommended (Postgres + Redis +
  MinIO + 4 Node processes concurrently).
- Docker Engine + Docker Compose plugin installed (`docker compose version`).
- Four DNS A records pointed at the VPS IP: `mirakart.com`,
  `admin.mirakart.com`, `seller.mirakart.com`, `api.mirakart.com` (match
  whatever you set in `.env`'s `*_DOMAIN` vars).
- Ports 80/443 open in the VPS firewall (`ufw allow 80,443/tcp`). Ports
  5432/6379/9000/9001 are **not** exposed in production
  (`docker-compose.prod.yml` strips the host bindings) — only reachable
  from inside the `mirakart-net` bridge network.

## 2. First-time setup

```bash
git clone <repo-url> /opt/mirakart && cd /opt/mirakart
cp .env.example .env
# Edit .env: set real POSTGRES_PASSWORD, REDIS_PASSWORD, MINIO_ROOT_PASSWORD,
# JWT secrets, the four *_DOMAIN vars, SMTP, payment provider keys.
chmod 600 .env
```

Bring up the data services first, run migrations, then the apps:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres redis minio minio-init
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm api pnpm db:migrate:deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## 3. SSL (Let's Encrypt)

The Nginx templates ship with the HTTPS `server` blocks commented out and
HTTP-only `server` blocks active (so certbot's HTTP-01 challenge can pass
on first boot). After the stack is up and DNS has propagated:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm \
  -v certbot-www:/var/www/certbot -v certbot-conf:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d mirakart.com -d admin.mirakart.com -d seller.mirakart.com -d api.mirakart.com \
  --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email
```

Then uncomment the `443 ssl http2` blocks in `infra/nginx/templates/*.conf.template`,
add a 80→443 redirect in the HTTP blocks, and reload:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload
```

The `certbot` service in `docker-compose.prod.yml` renews automatically
every 12h (no-op unless within 30 days of expiry).

## 4. Health checks & logging

- `GET https://api.mirakart.com/api/health` — Postgres connectivity via
  `@nestjs/terminus`. Docker Compose's `healthcheck:` on the `api` service
  also gates `web`/`admin`/`merchant` startup (`depends_on: condition:
  service_healthy`).
- Container logs are capped via the `json-file` driver (`max-size`/
  `max-file` in `docker-compose.prod.yml`) to bound disk usage; ship them
  off-box with your log aggregator of choice (not bundled — see Monitoring
  hooks below).

## 5. Monitoring hooks

No specific APM/metrics vendor is bundled (out of scope per Project Goal's
"Advanced Analytics" exclusion), but the integration points are:
`/api/health` for uptime checks, Nginx `access_log`/`error_log` for
request-level monitoring, and Postgres/Redis/MinIO each expose their
standard metrics endpoints if you attach Prometheus exporters later.

## 6. Redeploying after a code change

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm api pnpm db:migrate:deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## 7. Backups

- **Postgres**: `docker compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > backup-$(date +%F).sql.gz`, cron'd off-box.
- **MinIO**: the `minio-data` volume holds all product images, merchant
  documents, return images, and banners — back it up alongside Postgres
  (`mc mirror` to an external bucket, or a volume-level snapshot).
