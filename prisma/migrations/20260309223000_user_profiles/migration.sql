-- User profiles with unique Cheffia ID for authenticated users

CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supabase_user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "document" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "cheffia_id" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_supabase_user_id_uk"
    ON "public"."user_profiles"("supabase_user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_email_uk"
    ON "public"."user_profiles"("email");

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_document_uk"
    ON "public"."user_profiles"("document");

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_cheffia_id_uk"
    ON "public"."user_profiles"("cheffia_id");

CREATE INDEX IF NOT EXISTS "user_profiles_email_idx"
    ON "public"."user_profiles"("email");

CREATE INDEX IF NOT EXISTS "user_profiles_cheffia_id_idx"
    ON "public"."user_profiles"("cheffia_id");

DROP TRIGGER IF EXISTS "trg_user_profiles_set_updated_at" ON "public"."user_profiles";
CREATE TRIGGER "trg_user_profiles_set_updated_at"
BEFORE UPDATE ON "public"."user_profiles"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();
