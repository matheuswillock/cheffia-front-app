-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Extension required by the database-generated UUID defaults.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "membership_role" AS ENUM ('owner', 'manager', 'kitchen', 'waiter');

-- CreateEnum
CREATE TYPE "membership_status" AS ENUM ('invited', 'active', 'revoked');

-- CreateEnum
CREATE TYPE "idempotency_status" AS ENUM ('started', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "outbox_status" AS ENUM ('pending', 'published', 'failed');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "membership_role" NOT NULL,
    "status" "membership_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID,
    "method" VARCHAR(10) NOT NULL,
    "endpoint" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "request_hash" TEXT,
    "status" "idempotency_status" NOT NULL DEFAULT 'started',
    "response_status_code" INTEGER,
    "response_body" JSONB,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_version" INTEGER NOT NULL DEFAULT 1,
    "sequence" BIGSERIAL NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "outbox_status" NOT NULL DEFAULT 'pending',
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "outcome" TEXT NOT NULL,
    "metadata" JSONB,
    "request_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "restaurants_tenant_id_idx" ON "restaurants"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_tenant_id_uk" ON "restaurants"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_tenant_slug_uk" ON "restaurants"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "memberships_tenant_user_idx" ON "restaurant_memberships"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "memberships_restaurant_status_idx" ON "restaurant_memberships"("restaurant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_tenant_restaurant_user_uk" ON "restaurant_memberships"("tenant_id", "restaurant_id", "user_id");

-- CreateIndex
CREATE INDEX "idempotency_tenant_created_at_idx" ON "idempotency_keys"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_tenant_method_endpoint_key_uk" ON "idempotency_keys"("tenant_id", "method", "endpoint", "idempotency_key");

-- CreateIndex
CREATE INDEX "outbox_tenant_status_available_idx" ON "outbox_events"("tenant_id", "status", "available_at");

-- CreateIndex
CREATE INDEX "outbox_tenant_aggregate_idx" ON "outbox_events"("tenant_id", "aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "audit_tenant_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_tenant_entity_idx" ON "audit_logs"("tenant_id", "entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_memberships" ADD CONSTRAINT "restaurant_memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_memberships" ADD CONSTRAINT "restaurant_memberships_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
