-- schema.prisma's ReturnImage model has declared `sortOrder` since an earlier
-- change, but the initial migration's return_images table (001_initial_schema)
-- never got the column — every prisma.return.create() call has been failing
-- in production with "column sortOrder does not exist" (returns.repository.ts
-- create()). DEFAULT 0 backfills existing rows automatically on ADD COLUMN.
ALTER TABLE "return_images" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
