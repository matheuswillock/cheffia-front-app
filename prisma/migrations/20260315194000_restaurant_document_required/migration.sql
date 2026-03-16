-- Ensure restaurant document is always present.
-- Backfill missing values for legacy rows before enforcing NOT NULL.
UPDATE "restaurants"
SET "document" = REPLACE("id"::text, '-', '')
WHERE "document" IS NULL OR BTRIM("document") = '';

ALTER TABLE "restaurants"
  ALTER COLUMN "document" SET NOT NULL;
