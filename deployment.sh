#!/usr/bin/env bash
# Mirakart — production deployment script
# Usage:  sudo bash deployment.sh
# Runs on the VPS. Handles first-time SSL cert issuance and subsequent redeployments.
set -euo pipefail

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

# ── 1. Docker check ───────────────────────────────────────────────────────────
step "Checking Docker..."
command -v docker >/dev/null 2>&1 || {
  warn "Docker not found — installing..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
}
docker compose version >/dev/null 2>&1 || abort "Docker Compose v2 not found. Update Docker to >= 23.0"
info "Docker OK"

# ── 2. .env guard ─────────────────────────────────────────────────────────────
step "Checking .env..."
if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  warn ".env was missing — copied from .env.example"
  warn "Fill in all secrets (POSTGRES_PASSWORD, JWT secrets, SMTP, etc.) and re-run."
  abort "Aborted — populate .env first."
fi
info ".env present"

# ── 3. Patch production URLs inside .env ──────────────────────────────────────
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

# ── 4. Git pull ───────────────────────────────────────────────────────────────
step "Pulling latest code from origin/main..."
git pull origin main
info "Code up to date"

# ── 5. SSL certificate ────────────────────────────────────────────────────────
step "Checking SSL certificate..."

cert_exists() {
  # Inspect the certbot-conf volume for the domain cert
  docker volume inspect "$VOL_CERTBOT_CONF" >/dev/null 2>&1 || return 1
  local mount
  mount=$(docker volume inspect "$VOL_CERTBOT_CONF" --format '{{ .Mountpoint }}')
  [[ -f "$mount/live/$DOMAIN/fullchain.pem" ]]
}

if cert_exists; then
  info "SSL cert found — skipping issuance"
else
  warn "No SSL cert found for $DOMAIN — starting first-time issuance."

  # Ensure volumes exist before we touch them
  docker volume create "$VOL_CERTBOT_CONF" >/dev/null 2>&1 || true
  docker volume create "$VOL_CERTBOT_WWW"  >/dev/null 2>&1 || true

  # Create a temporary self-signed cert so nginx can start while we get the real one
  step "Creating temporary self-signed cert (lets nginx start on port 443)..."
  local_cert_mount=$(docker volume inspect "$VOL_CERTBOT_CONF" --format '{{ .Mountpoint }}')
  mkdir -p "$local_cert_mount/live/$DOMAIN"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$local_cert_mount/live/$DOMAIN/privkey.pem" \
    -out    "$local_cert_mount/live/$DOMAIN/fullchain.pem" \
    -subj   "/CN=$DOMAIN" 2>/dev/null
  info "Temporary cert created"

  # Start nginx so it can serve the ACME HTTP-01 challenge on port 80
  step "Starting nginx for HTTP challenge..."
  $COMPOSE_CMD up -d nginx
  sleep 5

  # Request the real cert from Let's Encrypt
  step "Requesting certificate from Let's Encrypt..."
  $COMPOSE_CMD run --rm \
    --entrypoint /bin/sh certbot -c "
      certbot certonly \
        --webroot -w /var/www/certbot \
        --email $CERTBOT_EMAIL \
        --agree-tos --no-eff-email \
        --force-renewal \
        -d $DOMAIN \
        -d www.$DOMAIN \
        -d admin.$DOMAIN \
        -d seller.$DOMAIN \
        -d api.$DOMAIN
    "
  info "Real SSL certificate issued"

  # Reload nginx so it picks up the real cert
  $COMPOSE_CMD exec -T nginx nginx -s reload
  info "Nginx reloaded with real cert"
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
until $COMPOSE_CMD exec -T api wget -qO- http://localhost:4000/api/health >/dev/null 2>&1; do
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
$COMPOSE_CMD exec -T api pnpm --filter @mirakart/api db:migrate
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
