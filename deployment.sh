#!/usr/bin/env bash
# Mirakart — production deployment script
# Usage:  sudo bash deployment.sh               → full deploy (build + start + migrate)
#         sudo bash deployment.sh --migrate-only → apply pending SQL migrations only (fast)
set -euo pipefail

MIGRATE_ONLY=false
for arg in "$@"; do
  [[ "$arg" == "--migrate-only" ]] && MIGRATE_ONLY=true
done

# ── Config ────────────────────────────────────────────────────────────────────
DOMAIN="astrovaak.online"
CERTBOT_EMAIL="admin@astrovaak.online"   # ← change to your email
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_CMD="docker compose --project-directory $APP_DIR \
  -f $APP_DIR/docker-compose.yml \
  -f $APP_DIR/docker-compose.prod.yml"

# Docker volume names  (project name = "mirakart" from docker-compose.yml)
VOL_CERTBOT_CONF="mirakart_certbot-conf"
VOL_CERTBOT_WWW="mirakart_certbot-www"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✓]${NC} $*"; }
step()  { echo -e "${CYAN}[→]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
abort() { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

# ── Root check ────────────────────────────────────────────────────────────────
[[ $EUID -eq 0 ]] || abort "Run as root: sudo bash deployment.sh"

cd "$APP_DIR"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       Mirakart — deploying to VPS           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Git pull ───────────────────────────────────────────────────────────────
step "Pulling latest code from origin/main..."
git pull origin main
info "Code up to date"

if [[ "$MIGRATE_ONLY" == "true" ]]; then
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║       Mirakart — migrations only            ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  step "Running database migrations (migrate-only mode)..."
  MIGRATIONS_DIR="$APP_DIR/apps/api/prisma/migrations"
  $COMPOSE_CMD exec -T postgres psql -U mirakart -d mirakart -c \
    "CREATE TABLE IF NOT EXISTS _schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW());" \
    >/dev/null 2>&1 || true
  mapfile -t SQL_FILES < <(find "$MIGRATIONS_DIR" -name "*.sql" | sort)
  for filepath in "${SQL_FILES[@]}"; do
    rel="${filepath#$MIGRATIONS_DIR/}"
    applied=$($COMPOSE_CMD exec -T postgres \
      psql -U mirakart -d mirakart -tAc \
      "SELECT COUNT(*) FROM _schema_migrations WHERE id='$rel';" 2>/dev/null | tr -d '[:space:]')
    if [[ "$applied" == "0" ]] || [[ -z "$applied" ]]; then
      echo "  → Applying: $rel"
      if $COMPOSE_CMD exec -T postgres psql -U mirakart -d mirakart < "$filepath"; then
        $COMPOSE_CMD exec -T postgres psql -U mirakart -d mirakart -c \
          "INSERT INTO _schema_migrations(id) VALUES ('$rel') ON CONFLICT DO NOTHING;" >/dev/null 2>&1
      else
        abort "Migration failed: $rel — check logs above."
      fi
    else
      echo "  ✓ Already applied: $rel"
    fi
  done
  info "Migrations applied"
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   Migrations applied successfully  ✓        ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  exit 0
fi

# ── 2. Docker check ───────────────────────────────────────────────────────────
step "Checking Docker..."
command -v docker >/dev/null 2>&1 || {
  warn "Docker not found — installing..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
}
docker compose version >/dev/null 2>&1 || abort "Docker Compose v2 not found. Update Docker to >= 23.0"
info "Docker OK"

# ── 3. .env guard ─────────────────────────────────────────────────────────────
step "Checking .env..."
if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  warn ".env was missing — copied from .env.example"
  warn "Fill in all secrets (POSTGRES_PASSWORD, JWT secrets, SMTP, etc.) and re-run."
  abort "Aborted — populate .env first."
fi
info ".env present"

# ── 4. Patch production URLs inside .env ──────────────────────────────────────
step "Ensuring production URLs in .env..."
# API URL
if grep -q 'NEXT_PUBLIC_API_URL=http://localhost' "$APP_DIR/.env"; then
  sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://api.$DOMAIN/api/v1|" "$APP_DIR/.env"
  info "NEXT_PUBLIC_API_URL → https://api.$DOMAIN/api/v1"
fi
# CORS origins
if grep -q 'CORS_ORIGINS=http://localhost' "$APP_DIR/.env"; then
  sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN,https://admin.$DOMAIN,https://seller.$DOMAIN|" "$APP_DIR/.env"
  info "CORS_ORIGINS updated"
fi
# NODE_ENV
if grep -q 'NODE_ENV=development' "$APP_DIR/.env"; then
  sed -i 's|NODE_ENV=development|NODE_ENV=production|' "$APP_DIR/.env"
  info "NODE_ENV=production"
fi

# ── 5. SSL certificate ────────────────────────────────────────────────────────
step "Checking SSL certificate..."

cert_exists() {
  docker volume inspect "$VOL_CERTBOT_CONF" >/dev/null 2>&1 || return 1
  local mount
  mount=$(docker volume inspect "$VOL_CERTBOT_CONF" --format '{{ .Mountpoint }}')
  [[ -f "$mount/live/$DOMAIN/fullchain.pem" ]]
}

if cert_exists; then
  info "SSL cert found — skipping issuance"
else
  warn "No SSL cert found — issuing certificate from Let's Encrypt (standalone mode)."
  warn "Port 80 must be open and DNS A records must point to this server."

  # Ensure the cert storage volume exists
  docker volume create "$VOL_CERTBOT_CONF" >/dev/null 2>&1 || true

  # Stop any containers that might be holding port 80
  $COMPOSE_CMD down 2>/dev/null || true

  # Certbot standalone: starts its own HTTP server on port 80, no nginx needed.
  # Renewals (after first issue) are handled by the certbot sidecar in docker-compose.prod.yml
  # using the webroot method through nginx.
  step "Running Certbot (standalone) to issue SSL certificate..."
  docker run --rm \
    -p 80:80 \
    -v "${VOL_CERTBOT_CONF}:/etc/letsencrypt" \
    certbot/certbot certonly \
      --standalone \
      --email "$CERTBOT_EMAIL" \
      --agree-tos \
      --no-eff-email \
      -d "$DOMAIN" \
      -d "www.$DOMAIN" \
      -d "admin.$DOMAIN" \
      -d "seller.$DOMAIN" \
      -d "api.$DOMAIN"

  info "SSL certificate issued for $DOMAIN and all subdomains"
fi

# ── 6. Build Docker images ────────────────────────────────────────────────────
step "Building Docker images (this may take several minutes on first run)..."
$COMPOSE_CMD build --parallel
info "Images built"

# ── 7. Start / recreate all services ─────────────────────────────────────────
step "Starting all services..."
$COMPOSE_CMD up -d --remove-orphans
info "Services started"

# ── 8. Wait for API health ────────────────────────────────────────────────────
step "Waiting for API to become healthy..."
ATTEMPTS=0
MAX=36  # 36 × 5s = 3 minutes
until $COMPOSE_CMD exec -T api wget -qO- http://localhost:4000/api/health/ping >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [[ $ATTEMPTS -ge $MAX ]]; then
    echo ""
    warn "API logs:"
    $COMPOSE_CMD logs --tail=50 api
    abort "API did not become healthy after $((MAX * 5))s. See logs above."
  fi
  printf "  waiting... (%d/%d)\r" "$ATTEMPTS" "$MAX"
  sleep 5
done
echo ""
info "API is healthy"

# ── 9. Database migrations ────────────────────────────────────────────────────
step "Running database migrations..."
MIGRATIONS_DIR="$APP_DIR/apps/api/prisma/migrations"

# Tracking table so each SQL file is only ever applied once
$COMPOSE_CMD exec -T postgres psql -U mirakart -d mirakart -c \
  "CREATE TABLE IF NOT EXISTS _schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW());" \
  >/dev/null 2>&1 || true

# Collect all .sql files (sorted alphabetically = chronological order)
mapfile -t SQL_FILES < <(find "$MIGRATIONS_DIR" -name "*.sql" | sort)

for filepath in "${SQL_FILES[@]}"; do
  rel="${filepath#$MIGRATIONS_DIR/}"
  applied=$($COMPOSE_CMD exec -T postgres \
    psql -U mirakart -d mirakart -tAc \
    "SELECT COUNT(*) FROM _schema_migrations WHERE id='$rel';" 2>/dev/null | tr -d '[:space:]')
  if [[ "$applied" == "0" ]] || [[ -z "$applied" ]]; then
    echo "  → Applying: $rel"
    if $COMPOSE_CMD exec -T postgres psql -U mirakart -d mirakart < "$filepath"; then
      $COMPOSE_CMD exec -T postgres psql -U mirakart -d mirakart -c \
        "INSERT INTO _schema_migrations(id) VALUES ('$rel') ON CONFLICT DO NOTHING;" >/dev/null 2>&1
    else
      abort "Migration failed: $rel — check logs above."
    fi
  else
    echo "  ✓ Already applied: $rel"
  fi
done
info "Migrations applied"

# ── 10. Nginx config test + reload ───────────────────────────────────────────
step "Testing and reloading nginx..."
$COMPOSE_CMD exec -T nginx nginx -t
$COMPOSE_CMD exec -T nginx nginx -s reload
info "Nginx reloaded"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Mirakart deployed successfully  ✓         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Store:    ${NC}https://$DOMAIN"
echo -e "  ${CYAN}Admin:    ${NC}https://admin.$DOMAIN"
echo -e "  ${CYAN}Merchant: ${NC}https://seller.$DOMAIN"
echo -e "  ${CYAN}API:      ${NC}https://api.$DOMAIN/api/v1"
echo ""
$COMPOSE_CMD ps
