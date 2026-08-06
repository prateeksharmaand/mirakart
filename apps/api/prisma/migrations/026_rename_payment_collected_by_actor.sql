-- Admin's "mark COD received" capability is moving to the merchant (the
-- merchant/delivery person who actually collected the cash). The old column
-- name assumed the collector was always an admin — rename it to a neutral
-- name now that merchants are the ones populating it going forward.
-- Existing values are untouched by the rename, so historical admin-collected
-- rows keep their original IDs (now just under a differently-named column).
ALTER TABLE "payments" RENAME COLUMN "collectedByAdminId" TO "collectedByActorId";
