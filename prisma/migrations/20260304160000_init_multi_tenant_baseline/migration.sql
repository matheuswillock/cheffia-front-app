-- Baseline multi-tenant schema for backend migration
-- Generated for Supabase Postgres

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE "public"."asaas_webhook_status" AS ENUM ('pending', 'processing', 'processed', 'failed');
CREATE TYPE "public"."idempotency_status" AS ENUM ('started', 'completed', 'failed');
CREATE TYPE "public"."outbox_status" AS ENUM ('pending', 'published', 'failed');

-- Tables
CREATE TABLE "public"."tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."restaurants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "supabase_user_id" UUID,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "restaurants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."idempotency_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "endpoint" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "request_hash" TEXT,
    "status" "public"."idempotency_status" NOT NULL DEFAULT 'started',
    "response_status_code" INTEGER,
    "response_body" JSONB,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "idempotency_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."asaas_webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "provider_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "raw_headers" JSONB NOT NULL,
    "signature_validated" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."asaas_webhook_status" NOT NULL DEFAULT 'pending',
    "processing_attempts" INTEGER NOT NULL DEFAULT 0,
    "first_received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "last_received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "processed_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "asaas_webhook_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "asaas_webhook_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "public"."outbox_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "public"."outbox_status" NOT NULL DEFAULT 'pending',
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "published_at" TIMESTAMPTZ(6),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "outbox_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Unique constraints
CREATE UNIQUE INDEX "tenants_slug_key" ON "public"."tenants"("slug");
CREATE UNIQUE INDEX "restaurants_tenant_id_uk" ON "public"."restaurants"("tenant_id", "id");
CREATE UNIQUE INDEX "idempotency_tenant_method_endpoint_key_uk"
    ON "public"."idempotency_keys"("tenant_id", "method", "endpoint", "idempotency_key");
CREATE UNIQUE INDEX "asaas_webhook_tenant_provider_event_uk"
    ON "public"."asaas_webhook_events"("tenant_id", "provider", "provider_event_id");

-- Secondary indexes
CREATE INDEX "restaurants_tenant_id_idx" ON "public"."restaurants"("tenant_id");
CREATE INDEX "restaurants_tenant_supabase_user_idx" ON "public"."restaurants"("tenant_id", "supabase_user_id");
CREATE INDEX "idempotency_tenant_created_at_idx" ON "public"."idempotency_keys"("tenant_id", "created_at");
CREATE INDEX "asaas_webhook_tenant_status_received_idx"
    ON "public"."asaas_webhook_events"("tenant_id", "status", "first_received_at");
CREATE INDEX "outbox_tenant_status_available_idx"
    ON "public"."outbox_events"("tenant_id", "status", "available_at");
CREATE INDEX "outbox_tenant_aggregate_idx"
    ON "public"."outbox_events"("tenant_id", "aggregate_type", "aggregate_id");

-- Shared trigger to keep updated_at consistent (outside Prisma client updates)
CREATE OR REPLACE FUNCTION "public"."set_updated_at"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trg_tenants_set_updated_at" ON "public"."tenants";
CREATE TRIGGER "trg_tenants_set_updated_at"
BEFORE UPDATE ON "public"."tenants"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_restaurants_set_updated_at" ON "public"."restaurants";
CREATE TRIGGER "trg_restaurants_set_updated_at"
BEFORE UPDATE ON "public"."restaurants"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_idempotency_keys_set_updated_at" ON "public"."idempotency_keys";
CREATE TRIGGER "trg_idempotency_keys_set_updated_at"
BEFORE UPDATE ON "public"."idempotency_keys"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_asaas_webhook_events_set_updated_at" ON "public"."asaas_webhook_events";
CREATE TRIGGER "trg_asaas_webhook_events_set_updated_at"
BEFORE UPDATE ON "public"."asaas_webhook_events"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_outbox_events_set_updated_at" ON "public"."outbox_events";
CREATE TRIGGER "trg_outbox_events_set_updated_at"
BEFORE UPDATE ON "public"."outbox_events"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();
