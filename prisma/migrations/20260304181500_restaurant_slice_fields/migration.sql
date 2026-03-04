-- Task 09: restaurant vertical slice compatibility fields

ALTER TABLE "public"."restaurants"
    ADD COLUMN IF NOT EXISTS "address" TEXT,
    ADD COLUMN IF NOT EXISTS "phone_number" TEXT,
    ADD COLUMN IF NOT EXISTS "email" TEXT,
    ADD COLUMN IF NOT EXISTS "owner_full_name" TEXT,
    ADD COLUMN IF NOT EXISTS "verification_code" TEXT,
    ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "register_date" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS "provider_avatar_url" TEXT,
    ADD COLUMN IF NOT EXISTS "restaurant_menu_id" UUID,
    ADD COLUMN IF NOT EXISTS "restaurant_kitchen_id" UUID;

CREATE INDEX IF NOT EXISTS "restaurants_tenant_verification_code_idx"
    ON "public"."restaurants"("tenant_id", "verification_code");

-- Unique constraints scoped by tenant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'restaurants_tenant_supabase_user_uk'
    ) THEN
        ALTER TABLE "public"."restaurants"
            ADD CONSTRAINT "restaurants_tenant_supabase_user_uk"
            UNIQUE ("tenant_id", "supabase_user_id");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'restaurants_tenant_email_uk'
    ) THEN
        ALTER TABLE "public"."restaurants"
            ADD CONSTRAINT "restaurants_tenant_email_uk"
            UNIQUE ("tenant_id", "email");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'restaurants_tenant_document_uk'
    ) THEN
        ALTER TABLE "public"."restaurants"
            ADD CONSTRAINT "restaurants_tenant_document_uk"
            UNIQUE ("tenant_id", "document");
    END IF;
END $$;
