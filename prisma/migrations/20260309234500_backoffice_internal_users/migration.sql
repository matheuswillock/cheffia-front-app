-- Backoffice interno Cheffia
-- - usuarios internos exclusivos
-- - status operacional do restaurante para monitoria/churn

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backoffice_user_role') THEN
        CREATE TYPE "public"."backoffice_user_role" AS ENUM (
            'admin',
            'operator'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'restaurant_lifecycle_status') THEN
        CREATE TYPE "public"."restaurant_lifecycle_status" AS ENUM (
            'active',
            'inactive',
            'cancelled'
        );
    END IF;
END $$;

ALTER TABLE "public"."restaurants"
    ADD COLUMN IF NOT EXISTS "lifecycle_status" "public"."restaurant_lifecycle_status" NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS "lifecycle_status_changed_at" TIMESTAMPTZ(6);

UPDATE "public"."restaurants"
SET "lifecycle_status" = 'active'
WHERE "lifecycle_status" IS NULL;

CREATE INDEX IF NOT EXISTS "restaurants_lifecycle_status_changed_idx"
    ON "public"."restaurants"("lifecycle_status", "lifecycle_status_changed_at");

CREATE TABLE IF NOT EXISTS "public"."internal_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supabase_user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "public"."backoffice_user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "internal_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "internal_users_supabase_user_id_uk"
    ON "public"."internal_users"("supabase_user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "internal_users_email_uk"
    ON "public"."internal_users"("email");

CREATE INDEX IF NOT EXISTS "internal_users_is_active_idx"
    ON "public"."internal_users"("is_active");

DROP TRIGGER IF EXISTS "trg_internal_users_set_updated_at" ON "public"."internal_users";
CREATE TRIGGER "trg_internal_users_set_updated_at"
BEFORE UPDATE ON "public"."internal_users"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();
