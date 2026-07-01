# Phase 2 Deployment Guide

## ⚠️ IMPORTANT: Breaking Changes

These migrations add FK constraints with RESTRICT cascade. This means:
- **Cannot delete merchants with products** — must delete products first
- **Cannot delete product variants from orders** — orders are immutable
- **Cannot delete addresses from orders** — orders reference addresses

## Pre-Deployment Steps

### 1. Backup Database (CRITICAL)
```bash
# SSH to VPS
ssh root@your-vps

# Create backup
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U mirakart mirakart > /root/backups/mirakart_backup_phase2_$(date +%s).sql

# Verify backup
ls -lh /root/backups/mirakart_backup_phase2_*
```

### 2. Verify Data Integrity (Check for orphans)
```bash
# Connect to PostgreSQL
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U mirakart -d mirakart <<SQL

-- Check for orphan products (merchant deleted but products exist)
SELECT COUNT(*) as orphan_products
FROM products p
LEFT JOIN merchants m ON p."merchantId" = m.id
WHERE m.id IS NULL AND p."deletedAt" IS NULL;

-- Check for orphan order items (variant deleted but order items exist)
SELECT COUNT(*) as orphan_order_items
FROM order_items oi
LEFT JOIN product_variants pv ON oi."variantId" = pv.id
WHERE pv.id IS NULL;

-- Check for orphan orders (customer deleted but orders exist)
SELECT COUNT(*) as orphan_orders
FROM orders o
LEFT JOIN customers c ON o."customerId" = c.id
WHERE c.id IS NULL AND o."deletedAt" IS NULL;

SQL
```

**If any counts > 0:** Delete orphan records before proceeding.

### 3. Pull Latest Code
```bash
cd /opt/mirakart
git pull origin main
```

### 4. Run Migrations in Order

**Migration 002: Add Foreign-Key Constraints**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U mirakart -d mirakart < apps/api/prisma/migrations/002_add_foreign_key_constraints.sql
```

**Migration 003: Add Missing Indexes**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U mirakart -d mirakart < apps/api/prisma/migrations/003_add_missing_indexes.sql
```

**Migration 004: Add Payment Idempotency**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U mirakart -d mirakart < apps/api/prisma/migrations/004_add_payment_idempotency.sql
```

### 5. Verify Migrations Applied
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U mirakart -d mirakart <<SQL

-- Check FK constraints added
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('products', 'order_items', 'orders', 'returns')
ORDER BY table_name;

-- Check indexes added
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND (indexname LIKE 'idx_%' OR indexname LIKE 'fk_%')
ORDER BY indexname;

SQL
```

### 6. Update NestJS Services Registration

Edit `apps/api/src/payments/payments.module.ts`:
```typescript
import { IdempotencyService } from './idempotency.service';

@Module({
  providers: [PaymentsService, PaymentsRepository, IdempotencyService],  // ADD IdempotencyService
  exports: [PaymentsService, IdempotencyService],
})
export class PaymentsModule {}
```

Edit `apps/api/src/cart/cart.module.ts`:
```typescript
import { CartLockService } from './cart-lock.service';

@Module({
  providers: [CartService, CartRepository, CartLockService],  // ADD CartLockService
  exports: [CartService, CartLockService],
})
export class CartModule {}
```

### 7. Rebuild and Restart Services

```bash
# Rebuild API image (includes new services)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build api

# Stop old containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Start services with new build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for health checks
sleep 30

# Verify all services healthy
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 8. Test API Endpoints

```bash
# Test health endpoint
curl -k https://api.astrovaak.online/api/health/ping

# Test product listing (now with optimized attribute filtering)
curl -k https://api.astrovaak.online/api/v1/products

# Test merchant dashboard
curl -k -H "Authorization: Bearer YOUR_MERCHANT_TOKEN" \
  https://api.astrovaak.online/api/v1/merchants/products

# Test cart operations (now with locking)
curl -k -X POST https://api.astrovaak.online/api/v1/cart/items \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"variantId":"...", "quantity": 1}'
```

### 9. Monitor Logs for Issues

```bash
# Watch API logs for errors
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api --tail=100

# Check for any migration-related errors
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs postgres --tail=50 | grep -i error
```

## Rollback Plan (If Issues Occur)

If deployment fails or causes issues:

```bash
# 1. Stop services
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# 2. Restore database from backup
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
sleep 10
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U mirakart -d mirakart < /root/backups/mirakart_backup_phase2_TIMESTAMP.sql

# 3. Revert code to previous commit
git revert HEAD --no-edit

# 4. Rebuild with old code
docker compose -f docker-compose.yml -f docker-compose.prod.yml build api
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Success Indicators

✅ All migrations applied without errors
✅ Foreign key constraints exist in pg_indexes
✅ All 15+ new indexes created
✅ API container healthy
✅ Soft-delete middleware active (no deleted records returned)
✅ Payment idempotency fields present
✅ Cart operations atomic (no race conditions)

## Performance Metrics to Check

After deployment, verify improvements:

```bash
# Check query performance (before/after)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U mirakart -d mirakart <<SQL
  
-- View index usage stats
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

SQL
```

---

## Timeline
- Pre-checks: ~5 minutes
- Migrations: ~2-5 minutes (depends on data size)
- Service rebuild: ~3-5 minutes
- Verification: ~10 minutes
- **Total: ~20-30 minutes**

## Support
If you encounter issues, check:
1. /root/backups/ for backup files
2. `docker compose logs` for error details
3. Database integrity with orphan check SQL above
