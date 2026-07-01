-- Migration 002.5: Install required PostgreSQL extensions
-- Purpose: Enable full-text search and other advanced features
-- Extensions: pg_trgm (trigram matching for fuzzy search)

BEGIN;

-- Install pg_trgm extension for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMIT;
