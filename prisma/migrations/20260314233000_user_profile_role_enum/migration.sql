-- CreateEnum
CREATE TYPE "user_profile_role" AS ENUM ('master', 'admin', 'operator');

-- Normalize legacy role values
UPDATE "user_profiles"
SET "role" = LOWER(TRIM("role"));

-- Map unknown legacy values to least-privileged role
UPDATE "user_profiles"
SET "role" = CASE
  WHEN "role" IN ('master', 'admin', 'operator') THEN "role"
  ELSE 'operator'
END;

-- AlterTable
ALTER TABLE "user_profiles"
ALTER COLUMN "role" TYPE "user_profile_role"
USING "role"::"user_profile_role";
