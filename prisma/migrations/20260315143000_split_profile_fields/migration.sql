-- Move role-specific fields from common user_profiles to internal_users.
ALTER TABLE "user_profiles"
  DROP COLUMN IF EXISTS "job_title",
  DROP COLUMN IF EXISTS "department";

ALTER TABLE "internal_users"
  ADD COLUMN IF NOT EXISTS "job_title" TEXT,
  ADD COLUMN IF NOT EXISTS "department" TEXT;
