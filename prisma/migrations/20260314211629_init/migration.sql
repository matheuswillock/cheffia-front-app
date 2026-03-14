-- CreateEnum
CREATE TYPE "asaas_webhook_status" AS ENUM ('pending', 'processing', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "idempotency_status" AS ENUM ('started', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "outbox_status" AS ENUM ('pending', 'published', 'failed');

-- CreateEnum
CREATE TYPE "order_print_job_status" AS ENUM ('claimed', 'printed', 'failed');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending', 'in_progress', 'ready', 'cancelled');

-- CreateEnum
CREATE TYPE "order_payment_status" AS ENUM ('pending', 'completed', 'paid', 'canceled', 'expired', 'processing', 'refunded', 'rejected', 'failed', 'unknown');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('pix', 'cash', 'apple_pay', 'google_pay', 'debit_card', 'samsung_pay', 'credit_card', 'bank_transfer', 'other', 'paypal', 'unknown');

-- CreateEnum
CREATE TYPE "asaas_account_type" AS ENUM ('standard', 'white_label');

-- CreateEnum
CREATE TYPE "account_approval_status" AS ENUM ('pending', 'awaiting_approval', 'approved', 'rejected', 'unknown');

-- CreateEnum
CREATE TYPE "financial_onboarding_status" AS ENUM ('draft', 'provisioning', 'account_created', 'awaiting_documents', 'awaiting_review', 'approved', 'rejected', 'blocked', 'failed', 'commercial_info_expired');

-- CreateEnum
CREATE TYPE "financial_webhook_status" AS ENUM ('pending', 'configured', 'failed', 'disabled');

-- CreateEnum
CREATE TYPE "settlement_strategy" AS ENUM ('split_automatico', 'transferencia_posterior');

-- CreateEnum
CREATE TYPE "fee_value_type" AS ENUM ('fixed', 'percentage');

-- CreateEnum
CREATE TYPE "financial_ledger_entry_type" AS ENUM ('charge_created', 'charge_paid', 'payment_received', 'provider_fee', 'platform_fee', 'payout_scheduled', 'payout_completed', 'payout_failed', 'refund', 'adjustment', 'reconciliation');

-- CreateEnum
CREATE TYPE "financial_entry_direction" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "payout_transfer_status" AS ENUM ('scheduled', 'processing', 'completed', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "financial_reconciliation_status" AS ENUM ('pending', 'matched', 'mismatched', 'ignored', 'failed');

-- CreateEnum
CREATE TYPE "financial_document_upload_status" AS ENUM ('stored', 'uploaded', 'failed');

-- CreateEnum
CREATE TYPE "backoffice_user_role" AS ENUM ('admin', 'operator');

-- CreateEnum
CREATE TYPE "restaurant_lifecycle_status" AS ENUM ('active', 'inactive', 'cancelled');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_users" (
    "id" UUID NOT NULL,
    "supabase_user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "backoffice_user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "internal_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "supabase_user_id" UUID,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone_number" TEXT,
    "email" TEXT,
    "owner_full_name" TEXT,
    "document" TEXT,
    "person_type" TEXT,
    "company_type" TEXT,
    "birth_date" DATE,
    "postal_code" TEXT,
    "address_number" TEXT,
    "province" TEXT,
    "complement" TEXT,
    "city" TEXT,
    "state" TEXT,
    "verification_code" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "lifecycle_status" "restaurant_lifecycle_status" NOT NULL DEFAULT 'active',
    "lifecycle_status_changed_at" TIMESTAMPTZ(6),
    "register_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "financial_onboarding_started_at" TIMESTAMPTZ(6),
    "financial_onboarding_completed_at" TIMESTAMPTZ(6),
    "provider_avatar_url" TEXT,
    "restaurant_menu_id" UUID,
    "restaurant_kitchen_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" DECIMAL(10,2) NOT NULL,
    "media_id" TEXT,
    "media_url" TEXT,
    "media_imgix_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "order_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "table_number" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL,
    "total_to_pay" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_order_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_order_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "order_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order_status" "order_status" NOT NULL DEFAULT 'pending',
    "price" DECIMAL(10,2) NOT NULL,
    "table_number" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "comments" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_order_payment_details" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_order_id" UUID NOT NULL,
    "financial_account_id" UUID,
    "transaction_id" TEXT,
    "provider_customer_id" TEXT,
    "payer_name" TEXT,
    "payer_phone_number" TEXT,
    "payer_email" TEXT,
    "payer_document" TEXT,
    "provider_payment_id" TEXT,
    "billing_type" TEXT,
    "status" "order_payment_status" NOT NULL DEFAULT 'pending',
    "method" "payment_method" NOT NULL DEFAULT 'unknown',
    "amount" DECIMAL(10,2),
    "gross_amount" DECIMAL(10,2),
    "net_amount" DECIMAL(10,2),
    "platform_fee_amount" DECIMAL(10,2),
    "provider_fee_amount" DECIMAL(10,2),
    "pix_qr_code" TEXT,
    "pix_copy_paste" TEXT,
    "external_reference" TEXT,
    "provider_raw_status" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "payment_date" TIMESTAMPTZ(6),
    "last_provider_sync_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_order_payment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "customer_order_id" UUID NOT NULL,
    "financial_account_id" UUID,
    "payment_date" TIMESTAMPTZ(6),
    "amount" DECIMAL(10,2) NOT NULL,
    "gross_amount" DECIMAL(10,2),
    "net_amount" DECIMAL(10,2),
    "platform_fee_amount" DECIMAL(10,2),
    "provider_fee_amount" DECIMAL(10,2),
    "transaction_id" TEXT NOT NULL,
    "method" "payment_method" NOT NULL,
    "status" "order_payment_status" NOT NULL,
    "settlement_strategy" "settlement_strategy",
    "provider_raw_status" TEXT,
    "available_at" TIMESTAMPTZ(6),
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "payment_details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurant_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_financial_accounts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "asaas_account_id" TEXT,
    "asaas_wallet_id" TEXT,
    "asaas_api_key_encrypted" TEXT,
    "asaas_api_key_last4" VARCHAR(4),
    "account_type" "asaas_account_type" NOT NULL DEFAULT 'white_label',
    "onboarding_status" "financial_onboarding_status" NOT NULL DEFAULT 'draft',
    "commercial_info_status" "account_approval_status" NOT NULL DEFAULT 'pending',
    "bank_account_status" "account_approval_status" NOT NULL DEFAULT 'pending',
    "documentation_status" "account_approval_status" NOT NULL DEFAULT 'pending',
    "general_status" "account_approval_status" NOT NULL DEFAULT 'pending',
    "commercial_info_expiration_scheduled_at" TIMESTAMPTZ(6),
    "commercial_info_is_expired" BOOLEAN NOT NULL DEFAULT false,
    "webhook_status" "financial_webhook_status" NOT NULL DEFAULT 'pending',
    "last_status_sync_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurant_financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_financial_onboarding_documents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "financial_account_id" UUID NOT NULL,
    "provider_document_group_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "responsible_name" TEXT,
    "responsible_type" TEXT,
    "status" "account_approval_status" NOT NULL DEFAULT 'pending',
    "onboarding_url" TEXT,
    "reject_reasons" JSONB,
    "last_synced_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurant_financial_onboarding_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_financial_onboarding_document_uploads" (
    "id" UUID NOT NULL,
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
    "status" "financial_document_upload_status" NOT NULL DEFAULT 'stored',
    "provider_raw_response" JSONB,
    "error_message" TEXT,
    "uploaded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurant_financial_onboarding_document_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_financial_settlement_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "financial_account_id" UUID,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "settlement_strategy" "settlement_strategy" NOT NULL DEFAULT 'split_automatico',
    "platform_fee_type" "fee_value_type" NOT NULL DEFAULT 'percentage',
    "platform_fee_value" DECIMAL(10,2) NOT NULL,
    "transfer_delay_days" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurant_financial_settlement_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_ledger_entries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "financial_account_id" UUID,
    "customer_order_id" UUID,
    "payment_detail_id" UUID,
    "payout_transfer_id" UUID,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "provider_reference" TEXT,
    "entry_type" "financial_ledger_entry_type" NOT NULL,
    "direction" "financial_entry_direction" NOT NULL,
    "gross_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "financial_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_payout_transfers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "financial_account_id" UUID,
    "customer_order_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "status" "payout_transfer_status" NOT NULL DEFAULT 'scheduled',
    "source_wallet_id" TEXT,
    "destination_wallet_id" TEXT NOT NULL,
    "provider_transfer_id" TEXT,
    "scheduled_for" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "restaurant_payout_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_reconciliation_runs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "scope" TEXT NOT NULL DEFAULT 'restaurant',
    "status" "financial_reconciliation_status" NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),
    "summary" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "financial_reconciliation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_reconciliation_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "reconciliation_run_id" UUID NOT NULL,
    "financial_account_id" UUID,
    "customer_order_id" UUID,
    "payment_detail_id" UUID,
    "provider_reference" TEXT,
    "status" "financial_reconciliation_status" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "internal_snapshot" JSONB,
    "provider_snapshot" JSONB,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "financial_reconciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "endpoint" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "request_hash" TEXT,
    "status" "idempotency_status" NOT NULL DEFAULT 'started',
    "response_status_code" INTEGER,
    "response_body" JSONB,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_print_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "outbox_event_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "printer_id" TEXT NOT NULL,
    "status" "order_print_job_status" NOT NULL DEFAULT 'claimed',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "payload_snapshot" JSONB,
    "claimed_at" TIMESTAMPTZ(6),
    "printed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_print_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asaas_webhook_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "provider_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "raw_headers" JSONB NOT NULL,
    "signature_validated" BOOLEAN NOT NULL DEFAULT false,
    "status" "asaas_webhook_status" NOT NULL DEFAULT 'pending',
    "processing_attempts" INTEGER NOT NULL DEFAULT 0,
    "first_received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "asaas_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "outbox_status" NOT NULL DEFAULT 'pending',
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_supabase_user_id_uk" ON "user_profiles"("supabase_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_uk" ON "user_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_document_uk" ON "user_profiles"("document");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_cheffia_id_uk" ON "user_profiles"("cheffia_id");

-- CreateIndex
CREATE INDEX "user_profiles_email_idx" ON "user_profiles"("email");

-- CreateIndex
CREATE INDEX "user_profiles_cheffia_id_idx" ON "user_profiles"("cheffia_id");

-- CreateIndex
CREATE UNIQUE INDEX "internal_users_supabase_user_id_uk" ON "internal_users"("supabase_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "internal_users_email_uk" ON "internal_users"("email");

-- CreateIndex
CREATE INDEX "internal_users_is_active_idx" ON "internal_users"("is_active");

-- CreateIndex
CREATE INDEX "restaurants_tenant_id_idx" ON "restaurants"("tenant_id");

-- CreateIndex
CREATE INDEX "restaurants_tenant_supabase_user_idx" ON "restaurants"("tenant_id", "supabase_user_id");

-- CreateIndex
CREATE INDEX "restaurants_tenant_verification_code_idx" ON "restaurants"("tenant_id", "verification_code");

-- CreateIndex
CREATE INDEX "restaurants_lifecycle_status_changed_idx" ON "restaurants"("lifecycle_status", "lifecycle_status_changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_tenant_supabase_user_uk" ON "restaurants"("tenant_id", "supabase_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_tenant_email_uk" ON "restaurants"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_tenant_document_uk" ON "restaurants"("tenant_id", "document");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_tenant_id_uk" ON "restaurants"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "menus_restaurant_id_uk" ON "menus"("restaurant_id");

-- CreateIndex
CREATE INDEX "menus_tenant_id_idx" ON "menus"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "menus_tenant_restaurant_uk" ON "menus"("tenant_id", "restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "menus_tenant_id_uk" ON "menus"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "menu_categories_tenant_id_idx" ON "menu_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_categories_tenant_menu_idx" ON "menu_categories"("tenant_id", "menu_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_tenant_menu_name_uk" ON "menu_categories"("tenant_id", "menu_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_tenant_id_uk" ON "menu_categories"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "menu_items_tenant_id_idx" ON "menu_items"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_items_tenant_menu_idx" ON "menu_items"("tenant_id", "menu_id");

-- CreateIndex
CREATE INDEX "menu_items_tenant_category_idx" ON "menu_items"("tenant_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_tenant_id_uk" ON "menu_items"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "customer_orders_tenant_id_idx" ON "customer_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_orders_tenant_restaurant_idx" ON "customer_orders"("tenant_id", "restaurant_id");

-- CreateIndex
CREATE INDEX "customer_orders_tenant_restaurant_order_date_idx" ON "customer_orders"("tenant_id", "restaurant_id", "order_date");

-- CreateIndex
CREATE UNIQUE INDEX "customer_orders_tenant_id_uk" ON "customer_orders"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "customer_order_items_tenant_id_idx" ON "customer_order_items"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_order_items_tenant_customer_order_idx" ON "customer_order_items"("tenant_id", "customer_order_id");

-- CreateIndex
CREATE INDEX "customer_order_items_tenant_menu_item_idx" ON "customer_order_items"("tenant_id", "menu_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_order_items_tenant_id_uk" ON "customer_order_items"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_order_payment_details_customer_order_id_uk" ON "customer_order_payment_details"("customer_order_id");

-- CreateIndex
CREATE INDEX "customer_order_payment_details_tenant_id_idx" ON "customer_order_payment_details"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_order_payment_details_tenant_transaction_idx" ON "customer_order_payment_details"("tenant_id", "transaction_id");

-- CreateIndex
CREATE INDEX "customer_order_payment_details_tenant_financial_account_idx" ON "customer_order_payment_details"("tenant_id", "financial_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_order_payment_details_tenant_provider_payment_uk" ON "customer_order_payment_details"("tenant_id", "provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_order_payment_details_tenant_transaction_uk" ON "customer_order_payment_details"("tenant_id", "transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_order_payment_details_tenant_id_uk" ON "customer_order_payment_details"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "restaurant_payments_tenant_id_idx" ON "restaurant_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "restaurant_payments_tenant_restaurant_idx" ON "restaurant_payments"("tenant_id", "restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_payments_tenant_customer_order_idx" ON "restaurant_payments"("tenant_id", "customer_order_id");

-- CreateIndex
CREATE INDEX "restaurant_payments_tenant_financial_account_idx" ON "restaurant_payments"("tenant_id", "financial_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_payments_tenant_transaction_uk" ON "restaurant_payments"("tenant_id", "transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_payments_tenant_id_uk" ON "restaurant_payments"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "restaurant_financial_accounts_tenant_id_idx" ON "restaurant_financial_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "restaurant_financial_accounts_tenant_restaurant_idx" ON "restaurant_financial_accounts"("tenant_id", "restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_financial_accounts_tenant_onboarding_idx" ON "restaurant_financial_accounts"("tenant_id", "onboarding_status");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_financial_accounts_tenant_id_uk" ON "restaurant_financial_accounts"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_financial_accounts_tenant_restaurant_provider_uk" ON "restaurant_financial_accounts"("tenant_id", "restaurant_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_financial_accounts_tenant_asaas_account_uk" ON "restaurant_financial_accounts"("tenant_id", "asaas_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_financial_accounts_tenant_asaas_wallet_uk" ON "restaurant_financial_accounts"("tenant_id", "asaas_wallet_id");

-- CreateIndex
CREATE INDEX "restaurant_financial_documents_tenant_id_idx" ON "restaurant_financial_onboarding_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "restaurant_financial_documents_tenant_restaurant_idx" ON "restaurant_financial_onboarding_documents"("tenant_id", "restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_financial_documents_account_status_idx" ON "restaurant_financial_onboarding_documents"("tenant_id", "financial_account_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_financial_documents_tenant_id_uk" ON "restaurant_financial_onboarding_documents"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_financial_documents_account_provider_group_uk" ON "restaurant_financial_onboarding_documents"("tenant_id", "financial_account_id", "provider_document_group_id");

-- CreateIndex
CREATE INDEX "restaurant_financial_document_uploads_tenant_id_idx" ON "restaurant_financial_onboarding_document_uploads"("tenant_id");

-- CreateIndex
CREATE INDEX "restaurant_financial_document_uploads_tenant_restaurant_idx" ON "restaurant_financial_onboarding_document_uploads"("tenant_id", "restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_financial_document_uploads_tenant_document_idx" ON "restaurant_financial_onboarding_document_uploads"("tenant_id", "onboarding_document_id");

-- CreateIndex
CREATE INDEX "restaurant_financial_document_uploads_account_status_idx" ON "restaurant_financial_onboarding_document_uploads"("tenant_id", "financial_account_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_financial_document_uploads_tenant_id_uk" ON "restaurant_financial_onboarding_document_uploads"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "restaurant_financial_rules_tenant_id_idx" ON "restaurant_financial_settlement_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "restaurant_financial_rules_restaurant_active_idx" ON "restaurant_financial_settlement_rules"("tenant_id", "restaurant_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_financial_rules_tenant_id_uk" ON "restaurant_financial_settlement_rules"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "financial_ledger_entries_tenant_id_idx" ON "financial_ledger_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "financial_ledger_entries_restaurant_occurred_idx" ON "financial_ledger_entries"("tenant_id", "restaurant_id", "occurred_at");

-- CreateIndex
CREATE INDEX "financial_ledger_entries_account_idx" ON "financial_ledger_entries"("tenant_id", "financial_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_ledger_entries_tenant_id_uk" ON "financial_ledger_entries"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "restaurant_payout_transfers_tenant_id_idx" ON "restaurant_payout_transfers"("tenant_id");

-- CreateIndex
CREATE INDEX "restaurant_payout_transfers_schedule_idx" ON "restaurant_payout_transfers"("tenant_id", "restaurant_id", "status", "scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_payout_transfers_tenant_id_uk" ON "restaurant_payout_transfers"("tenant_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_payout_transfers_tenant_provider_transfer_uk" ON "restaurant_payout_transfers"("tenant_id", "provider_transfer_id");

-- CreateIndex
CREATE INDEX "financial_reconciliation_runs_tenant_id_idx" ON "financial_reconciliation_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "financial_reconciliation_runs_restaurant_status_idx" ON "financial_reconciliation_runs"("tenant_id", "restaurant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "financial_reconciliation_runs_tenant_id_uk" ON "financial_reconciliation_runs"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "financial_reconciliation_items_tenant_id_idx" ON "financial_reconciliation_items"("tenant_id");

-- CreateIndex
CREATE INDEX "financial_reconciliation_items_restaurant_status_idx" ON "financial_reconciliation_items"("tenant_id", "restaurant_id", "status");

-- CreateIndex
CREATE INDEX "financial_reconciliation_items_run_idx" ON "financial_reconciliation_items"("tenant_id", "reconciliation_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_reconciliation_items_tenant_id_uk" ON "financial_reconciliation_items"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "idempotency_tenant_created_at_idx" ON "idempotency_keys"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_tenant_method_endpoint_key_uk" ON "idempotency_keys"("tenant_id", "method", "endpoint", "idempotency_key");

-- CreateIndex
CREATE INDEX "order_print_jobs_tenant_restaurant_status_idx" ON "order_print_jobs"("tenant_id", "restaurant_id", "status");

-- CreateIndex
CREATE INDEX "order_print_jobs_tenant_created_at_idx" ON "order_print_jobs"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "order_print_jobs_tenant_event_printer_uk" ON "order_print_jobs"("tenant_id", "outbox_event_id", "printer_id");

-- CreateIndex
CREATE INDEX "asaas_webhook_tenant_status_received_idx" ON "asaas_webhook_events"("tenant_id", "status", "first_received_at");

-- CreateIndex
CREATE UNIQUE INDEX "asaas_webhook_tenant_provider_event_uk" ON "asaas_webhook_events"("tenant_id", "provider", "provider_event_id");

-- CreateIndex
CREATE INDEX "outbox_tenant_status_available_idx" ON "outbox_events"("tenant_id", "status", "available_at");

-- CreateIndex
CREATE INDEX "outbox_tenant_aggregate_idx" ON "outbox_events"("tenant_id", "aggregate_type", "aggregate_id");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_supabase_user_id_fkey" FOREIGN KEY ("supabase_user_id") REFERENCES "user_profiles"("supabase_user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_payment_details" ADD CONSTRAINT "customer_order_payment_details_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_payment_details" ADD CONSTRAINT "customer_order_payment_details_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_payment_details" ADD CONSTRAINT "customer_order_payment_details_tenant_id_financial_account_fkey" FOREIGN KEY ("tenant_id", "financial_account_id") REFERENCES "restaurant_financial_accounts"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_payments" ADD CONSTRAINT "restaurant_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_payments" ADD CONSTRAINT "restaurant_payments_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_payments" ADD CONSTRAINT "restaurant_payments_customer_order_id_fkey" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_payments" ADD CONSTRAINT "restaurant_payments_tenant_id_financial_account_id_fkey" FOREIGN KEY ("tenant_id", "financial_account_id") REFERENCES "restaurant_financial_accounts"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_accounts" ADD CONSTRAINT "restaurant_financial_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_accounts" ADD CONSTRAINT "restaurant_financial_accounts_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_onboarding_documents" ADD CONSTRAINT "restaurant_financial_onboarding_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_onboarding_documents" ADD CONSTRAINT "restaurant_financial_onboarding_documents_tenant_id_restau_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_onboarding_documents" ADD CONSTRAINT "restaurant_financial_onboarding_documents_tenant_id_financ_fkey" FOREIGN KEY ("tenant_id", "financial_account_id") REFERENCES "restaurant_financial_accounts"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_onboarding_document_uploads" ADD CONSTRAINT "restaurant_financial_document_uploads_tenant_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_onboarding_document_uploads" ADD CONSTRAINT "restaurant_financial_document_uploads_tenant_restaurant_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_onboarding_document_uploads" ADD CONSTRAINT "restaurant_financial_document_uploads_tenant_account_fkey" FOREIGN KEY ("tenant_id", "financial_account_id") REFERENCES "restaurant_financial_accounts"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_onboarding_document_uploads" ADD CONSTRAINT "restaurant_financial_document_uploads_tenant_document_fkey" FOREIGN KEY ("tenant_id", "onboarding_document_id") REFERENCES "restaurant_financial_onboarding_documents"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_settlement_rules" ADD CONSTRAINT "restaurant_financial_settlement_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_settlement_rules" ADD CONSTRAINT "restaurant_financial_settlement_rules_tenant_id_restaurant_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_financial_settlement_rules" ADD CONSTRAINT "restaurant_financial_settlement_rules_tenant_id_financial__fkey" FOREIGN KEY ("tenant_id", "financial_account_id") REFERENCES "restaurant_financial_accounts"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_tenant_id_financial_account_id_fkey" FOREIGN KEY ("tenant_id", "financial_account_id") REFERENCES "restaurant_financial_accounts"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_tenant_id_customer_order_id_fkey" FOREIGN KEY ("tenant_id", "customer_order_id") REFERENCES "customer_orders"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_tenant_id_payment_detail_id_fkey" FOREIGN KEY ("tenant_id", "payment_detail_id") REFERENCES "customer_order_payment_details"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_tenant_id_payout_transfer_id_fkey" FOREIGN KEY ("tenant_id", "payout_transfer_id") REFERENCES "restaurant_payout_transfers"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_payout_transfers" ADD CONSTRAINT "restaurant_payout_transfers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_payout_transfers" ADD CONSTRAINT "restaurant_payout_transfers_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_payout_transfers" ADD CONSTRAINT "restaurant_payout_transfers_tenant_id_financial_account_id_fkey" FOREIGN KEY ("tenant_id", "financial_account_id") REFERENCES "restaurant_financial_accounts"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_payout_transfers" ADD CONSTRAINT "restaurant_payout_transfers_tenant_id_customer_order_id_fkey" FOREIGN KEY ("tenant_id", "customer_order_id") REFERENCES "customer_orders"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reconciliation_runs" ADD CONSTRAINT "financial_reconciliation_runs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reconciliation_runs" ADD CONSTRAINT "financial_reconciliation_runs_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reconciliation_items" ADD CONSTRAINT "financial_reconciliation_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reconciliation_items" ADD CONSTRAINT "financial_reconciliation_items_tenant_id_restaurant_id_fkey" FOREIGN KEY ("tenant_id", "restaurant_id") REFERENCES "restaurants"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reconciliation_items" ADD CONSTRAINT "financial_reconciliation_items_tenant_id_reconciliation_ru_fkey" FOREIGN KEY ("tenant_id", "reconciliation_run_id") REFERENCES "financial_reconciliation_runs"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reconciliation_items" ADD CONSTRAINT "financial_reconciliation_items_tenant_id_financial_account_fkey" FOREIGN KEY ("tenant_id", "financial_account_id") REFERENCES "restaurant_financial_accounts"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reconciliation_items" ADD CONSTRAINT "financial_reconciliation_items_tenant_id_customer_order_id_fkey" FOREIGN KEY ("tenant_id", "customer_order_id") REFERENCES "customer_orders"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reconciliation_items" ADD CONSTRAINT "financial_reconciliation_items_tenant_id_payment_detail_id_fkey" FOREIGN KEY ("tenant_id", "payment_detail_id") REFERENCES "customer_order_payment_details"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_print_jobs" ADD CONSTRAINT "order_print_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_print_jobs" ADD CONSTRAINT "order_print_jobs_outbox_event_id_fkey" FOREIGN KEY ("outbox_event_id") REFERENCES "outbox_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asaas_webhook_events" ADD CONSTRAINT "asaas_webhook_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
