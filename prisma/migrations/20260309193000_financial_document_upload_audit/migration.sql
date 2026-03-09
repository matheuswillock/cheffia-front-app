-- Task 21: audit trail for Asaas financial onboarding document uploads
-- Stores every file sent through Cheffia before forwarding to Asaas.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_document_upload_status') THEN
        CREATE TYPE "public"."financial_document_upload_status" AS ENUM (
            'stored',
            'uploaded',
            'failed'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "public"."restaurant_financial_onboarding_document_uploads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "financial_account_id" UUID NOT NULL,
    "onboarding_document_id" UUID NOT NULL,
    "provider_document_group_id" TEXT NOT NULL,
    "provider_document_file_id" TEXT,
    "upload_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_bucket" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "sha256" VARCHAR(64),
    "status" "public"."financial_document_upload_status" NOT NULL DEFAULT 'stored',
    "provider_raw_response" JSONB,
    "error_message" TEXT,
    "uploaded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "restaurant_financial_document_uploads_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "restaurant_financial_document_uploads_tenant_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_financial_document_uploads_tenant_restaurant_fkey"
        FOREIGN KEY ("tenant_id", "restaurant_id")
        REFERENCES "public"."restaurants"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_financial_document_uploads_tenant_account_fkey"
        FOREIGN KEY ("tenant_id", "financial_account_id")
        REFERENCES "public"."restaurant_financial_accounts"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_financial_document_uploads_tenant_document_fkey"
        FOREIGN KEY ("tenant_id", "onboarding_document_id")
        REFERENCES "public"."restaurant_financial_onboarding_documents"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_financial_document_uploads_tenant_id_uk"
    ON "public"."restaurant_financial_onboarding_document_uploads"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_document_uploads_tenant_id_idx"
    ON "public"."restaurant_financial_onboarding_document_uploads"("tenant_id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_document_uploads_tenant_restaurant_idx"
    ON "public"."restaurant_financial_onboarding_document_uploads"("tenant_id", "restaurant_id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_document_uploads_tenant_document_idx"
    ON "public"."restaurant_financial_onboarding_document_uploads"("tenant_id", "onboarding_document_id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_document_uploads_account_status_idx"
    ON "public"."restaurant_financial_onboarding_document_uploads"("tenant_id", "financial_account_id", "status");

DROP TRIGGER IF EXISTS "trg_restaurant_financial_document_uploads_set_updated_at" ON "public"."restaurant_financial_onboarding_document_uploads";
CREATE TRIGGER "trg_restaurant_financial_document_uploads_set_updated_at"
BEFORE UPDATE ON "public"."restaurant_financial_onboarding_document_uploads"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();
