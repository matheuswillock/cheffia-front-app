-- Task 21: Asaas subaccounts financial domain
-- Adds tenant-scoped financial account/onboarding/ledger/payout/reconciliation structures
-- and extends restaurant/payment tables to support Asaas as the only payment provider.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asaas_account_type') THEN
        CREATE TYPE "public"."asaas_account_type" AS ENUM ('standard', 'white_label');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_approval_status') THEN
        CREATE TYPE "public"."account_approval_status" AS ENUM (
            'pending',
            'awaiting_approval',
            'approved',
            'rejected',
            'unknown'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_onboarding_status') THEN
        CREATE TYPE "public"."financial_onboarding_status" AS ENUM (
            'draft',
            'provisioning',
            'account_created',
            'awaiting_documents',
            'awaiting_review',
            'approved',
            'rejected',
            'blocked',
            'failed',
            'commercial_info_expired'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_webhook_status') THEN
        CREATE TYPE "public"."financial_webhook_status" AS ENUM (
            'pending',
            'configured',
            'failed',
            'disabled'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'settlement_strategy') THEN
        CREATE TYPE "public"."settlement_strategy" AS ENUM (
            'split_automatico',
            'transferencia_posterior'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fee_value_type') THEN
        CREATE TYPE "public"."fee_value_type" AS ENUM ('fixed', 'percentage');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_ledger_entry_type') THEN
        CREATE TYPE "public"."financial_ledger_entry_type" AS ENUM (
            'charge_created',
            'charge_paid',
            'payment_received',
            'provider_fee',
            'platform_fee',
            'payout_scheduled',
            'payout_completed',
            'payout_failed',
            'refund',
            'adjustment',
            'reconciliation'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_entry_direction') THEN
        CREATE TYPE "public"."financial_entry_direction" AS ENUM ('credit', 'debit');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_transfer_status') THEN
        CREATE TYPE "public"."payout_transfer_status" AS ENUM (
            'scheduled',
            'processing',
            'completed',
            'failed',
            'canceled'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_reconciliation_status') THEN
        CREATE TYPE "public"."financial_reconciliation_status" AS ENUM (
            'pending',
            'matched',
            'mismatched',
            'ignored',
            'failed'
        );
    END IF;
END $$;

ALTER TABLE "public"."restaurants"
    ADD COLUMN IF NOT EXISTS "person_type" TEXT,
    ADD COLUMN IF NOT EXISTS "company_type" TEXT,
    ADD COLUMN IF NOT EXISTS "birth_date" DATE,
    ADD COLUMN IF NOT EXISTS "postal_code" TEXT,
    ADD COLUMN IF NOT EXISTS "address_number" TEXT,
    ADD COLUMN IF NOT EXISTS "province" TEXT,
    ADD COLUMN IF NOT EXISTS "complement" TEXT,
    ADD COLUMN IF NOT EXISTS "city" TEXT,
    ADD COLUMN IF NOT EXISTS "state" TEXT,
    ADD COLUMN IF NOT EXISTS "financial_onboarding_started_at" TIMESTAMPTZ(6),
    ADD COLUMN IF NOT EXISTS "financial_onboarding_completed_at" TIMESTAMPTZ(6);

CREATE TABLE IF NOT EXISTS "public"."restaurant_financial_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "asaas_account_id" TEXT,
    "asaas_wallet_id" TEXT,
    "asaas_api_key_encrypted" TEXT,
    "asaas_api_key_last4" VARCHAR(4),
    "account_type" "public"."asaas_account_type" NOT NULL DEFAULT 'white_label',
    "onboarding_status" "public"."financial_onboarding_status" NOT NULL DEFAULT 'draft',
    "commercial_info_status" "public"."account_approval_status" NOT NULL DEFAULT 'pending',
    "bank_account_status" "public"."account_approval_status" NOT NULL DEFAULT 'pending',
    "documentation_status" "public"."account_approval_status" NOT NULL DEFAULT 'pending',
    "general_status" "public"."account_approval_status" NOT NULL DEFAULT 'pending',
    "commercial_info_expiration_scheduled_at" TIMESTAMPTZ(6),
    "commercial_info_is_expired" BOOLEAN NOT NULL DEFAULT false,
    "webhook_status" "public"."financial_webhook_status" NOT NULL DEFAULT 'pending',
    "last_status_sync_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "restaurant_financial_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "restaurant_financial_accounts_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_financial_accounts_tenant_restaurant_fkey"
        FOREIGN KEY ("tenant_id", "restaurant_id")
        REFERENCES "public"."restaurants"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_financial_accounts_tenant_id_uk"
    ON "public"."restaurant_financial_accounts"("tenant_id", "id");

CREATE TABLE IF NOT EXISTS "public"."restaurant_financial_onboarding_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "financial_account_id" UUID NOT NULL,
    "provider_document_group_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "responsible_name" TEXT,
    "responsible_type" TEXT,
    "status" "public"."account_approval_status" NOT NULL DEFAULT 'pending',
    "onboarding_url" TEXT,
    "reject_reasons" JSONB,
    "last_synced_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "restaurant_financial_onboarding_documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "restaurant_financial_documents_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_financial_documents_tenant_restaurant_fkey"
        FOREIGN KEY ("tenant_id", "restaurant_id")
        REFERENCES "public"."restaurants"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_financial_documents_tenant_account_fkey"
        FOREIGN KEY ("tenant_id", "financial_account_id")
        REFERENCES "public"."restaurant_financial_accounts"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_financial_documents_tenant_id_uk"
    ON "public"."restaurant_financial_onboarding_documents"("tenant_id", "id");

CREATE TABLE IF NOT EXISTS "public"."restaurant_financial_settlement_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "financial_account_id" UUID,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "settlement_strategy" "public"."settlement_strategy" NOT NULL DEFAULT 'split_automatico',
    "platform_fee_type" "public"."fee_value_type" NOT NULL DEFAULT 'percentage',
    "platform_fee_value" DECIMAL(10,2) NOT NULL,
    "transfer_delay_days" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "effective_to" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "restaurant_financial_settlement_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "restaurant_financial_rules_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_financial_rules_tenant_restaurant_fkey"
        FOREIGN KEY ("tenant_id", "restaurant_id")
        REFERENCES "public"."restaurants"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_financial_rules_tenant_account_fkey"
        FOREIGN KEY ("tenant_id", "financial_account_id")
        REFERENCES "public"."restaurant_financial_accounts"("tenant_id", "id")
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);

ALTER TABLE "public"."customer_order_payment_details"
    ADD COLUMN IF NOT EXISTS "financial_account_id" UUID,
    ADD COLUMN IF NOT EXISTS "provider_customer_id" TEXT,
    ADD COLUMN IF NOT EXISTS "provider_payment_id" TEXT,
    ADD COLUMN IF NOT EXISTS "billing_type" TEXT,
    ADD COLUMN IF NOT EXISTS "gross_amount" DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "net_amount" DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "platform_fee_amount" DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "provider_fee_amount" DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "pix_qr_code" TEXT,
    ADD COLUMN IF NOT EXISTS "pix_copy_paste" TEXT,
    ADD COLUMN IF NOT EXISTS "external_reference" TEXT,
    ADD COLUMN IF NOT EXISTS "provider_raw_status" TEXT,
    ADD COLUMN IF NOT EXISTS "last_provider_sync_at" TIMESTAMPTZ(6);

ALTER TABLE "public"."restaurant_payments"
    ADD COLUMN IF NOT EXISTS "financial_account_id" UUID,
    ADD COLUMN IF NOT EXISTS "gross_amount" DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "net_amount" DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "platform_fee_amount" DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "provider_fee_amount" DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "settlement_strategy" "public"."settlement_strategy",
    ADD COLUMN IF NOT EXISTS "provider_raw_status" TEXT,
    ADD COLUMN IF NOT EXISTS "available_at" TIMESTAMPTZ(6);

CREATE TABLE IF NOT EXISTS "public"."restaurant_payout_transfers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "financial_account_id" UUID,
    "customer_order_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "status" "public"."payout_transfer_status" NOT NULL DEFAULT 'scheduled',
    "source_wallet_id" TEXT,
    "destination_wallet_id" TEXT NOT NULL,
    "provider_transfer_id" TEXT,
    "scheduled_for" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "processed_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "restaurant_payout_transfers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "restaurant_payout_transfers_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_payout_transfers_tenant_restaurant_fkey"
        FOREIGN KEY ("tenant_id", "restaurant_id")
        REFERENCES "public"."restaurants"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_payout_transfers_tenant_account_fkey"
        FOREIGN KEY ("tenant_id", "financial_account_id")
        REFERENCES "public"."restaurant_financial_accounts"("tenant_id", "id")
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_payout_transfers_tenant_order_fkey"
        FOREIGN KEY ("tenant_id", "customer_order_id")
        REFERENCES "public"."customer_orders"("tenant_id", "id")
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_payout_transfers_tenant_id_uk"
    ON "public"."restaurant_payout_transfers"("tenant_id", "id");

CREATE TABLE IF NOT EXISTS "public"."financial_ledger_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "financial_account_id" UUID,
    "customer_order_id" UUID,
    "payment_detail_id" UUID,
    "payout_transfer_id" UUID,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "provider_reference" TEXT,
    "entry_type" "public"."financial_ledger_entry_type" NOT NULL,
    "direction" "public"."financial_entry_direction" NOT NULL,
    "gross_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "financial_ledger_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "financial_ledger_entries_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "financial_ledger_entries_tenant_restaurant_fkey"
        FOREIGN KEY ("tenant_id", "restaurant_id")
        REFERENCES "public"."restaurants"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "financial_ledger_entries_tenant_account_fkey"
        FOREIGN KEY ("tenant_id", "financial_account_id")
        REFERENCES "public"."restaurant_financial_accounts"("tenant_id", "id")
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT "financial_ledger_entries_tenant_order_fkey"
        FOREIGN KEY ("tenant_id", "customer_order_id")
        REFERENCES "public"."customer_orders"("tenant_id", "id")
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT "financial_ledger_entries_tenant_payment_detail_fkey"
        FOREIGN KEY ("tenant_id", "payment_detail_id")
        REFERENCES "public"."customer_order_payment_details"("tenant_id", "id")
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT "financial_ledger_entries_tenant_payout_transfer_fkey"
        FOREIGN KEY ("tenant_id", "payout_transfer_id")
        REFERENCES "public"."restaurant_payout_transfers"("tenant_id", "id")
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."financial_reconciliation_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "scope" TEXT NOT NULL DEFAULT 'restaurant',
    "status" "public"."financial_reconciliation_status" NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "finished_at" TIMESTAMPTZ(6),
    "summary" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "financial_reconciliation_runs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "financial_reconciliation_runs_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "financial_reconciliation_runs_tenant_restaurant_fkey"
        FOREIGN KEY ("tenant_id", "restaurant_id")
        REFERENCES "public"."restaurants"("tenant_id", "id")
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "financial_reconciliation_runs_tenant_id_uk"
    ON "public"."financial_reconciliation_runs"("tenant_id", "id");

CREATE TABLE IF NOT EXISTS "public"."financial_reconciliation_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "reconciliation_run_id" UUID NOT NULL,
    "financial_account_id" UUID,
    "customer_order_id" UUID,
    "payment_detail_id" UUID,
    "provider_reference" TEXT,
    "status" "public"."financial_reconciliation_status" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "internal_snapshot" JSONB,
    "provider_snapshot" JSONB,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "financial_reconciliation_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "financial_reconciliation_items_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "financial_reconciliation_items_tenant_restaurant_fkey"
        FOREIGN KEY ("tenant_id", "restaurant_id")
        REFERENCES "public"."restaurants"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "financial_reconciliation_items_tenant_run_fkey"
        FOREIGN KEY ("tenant_id", "reconciliation_run_id")
        REFERENCES "public"."financial_reconciliation_runs"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "financial_reconciliation_items_tenant_account_fkey"
        FOREIGN KEY ("tenant_id", "financial_account_id")
        REFERENCES "public"."restaurant_financial_accounts"("tenant_id", "id")
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT "financial_reconciliation_items_tenant_order_fkey"
        FOREIGN KEY ("tenant_id", "customer_order_id")
        REFERENCES "public"."customer_orders"("tenant_id", "id")
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT "financial_reconciliation_items_tenant_payment_detail_fkey"
        FOREIGN KEY ("tenant_id", "payment_detail_id")
        REFERENCES "public"."customer_order_payment_details"("tenant_id", "id")
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_financial_accounts_tenant_id_uk"
    ON "public"."restaurant_financial_accounts"("tenant_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_financial_accounts_tenant_restaurant_provider_uk"
    ON "public"."restaurant_financial_accounts"("tenant_id", "restaurant_id", "provider");
CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_financial_accounts_tenant_asaas_account_uk"
    ON "public"."restaurant_financial_accounts"("tenant_id", "asaas_account_id");
CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_financial_accounts_tenant_asaas_wallet_uk"
    ON "public"."restaurant_financial_accounts"("tenant_id", "asaas_wallet_id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_accounts_tenant_id_idx"
    ON "public"."restaurant_financial_accounts"("tenant_id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_accounts_tenant_restaurant_idx"
    ON "public"."restaurant_financial_accounts"("tenant_id", "restaurant_id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_accounts_tenant_onboarding_idx"
    ON "public"."restaurant_financial_accounts"("tenant_id", "onboarding_status");

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_financial_documents_tenant_id_uk"
    ON "public"."restaurant_financial_onboarding_documents"("tenant_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_financial_documents_account_provider_group_uk"
    ON "public"."restaurant_financial_onboarding_documents"("tenant_id", "financial_account_id", "provider_document_group_id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_documents_tenant_id_idx"
    ON "public"."restaurant_financial_onboarding_documents"("tenant_id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_documents_tenant_restaurant_idx"
    ON "public"."restaurant_financial_onboarding_documents"("tenant_id", "restaurant_id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_documents_account_status_idx"
    ON "public"."restaurant_financial_onboarding_documents"("tenant_id", "financial_account_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_financial_rules_tenant_id_uk"
    ON "public"."restaurant_financial_settlement_rules"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_rules_tenant_id_idx"
    ON "public"."restaurant_financial_settlement_rules"("tenant_id");
CREATE INDEX IF NOT EXISTS "restaurant_financial_rules_restaurant_active_idx"
    ON "public"."restaurant_financial_settlement_rules"("tenant_id", "restaurant_id", "active");

CREATE UNIQUE INDEX IF NOT EXISTS "customer_order_payment_details_tenant_provider_payment_uk"
    ON "public"."customer_order_payment_details"("tenant_id", "provider_payment_id");
CREATE INDEX IF NOT EXISTS "customer_order_payment_details_tenant_financial_account_idx"
    ON "public"."customer_order_payment_details"("tenant_id", "financial_account_id");

CREATE INDEX IF NOT EXISTS "restaurant_payments_tenant_financial_account_idx"
    ON "public"."restaurant_payments"("tenant_id", "financial_account_id");

CREATE UNIQUE INDEX IF NOT EXISTS "financial_ledger_entries_tenant_id_uk"
    ON "public"."financial_ledger_entries"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "financial_ledger_entries_tenant_id_idx"
    ON "public"."financial_ledger_entries"("tenant_id");
CREATE INDEX IF NOT EXISTS "financial_ledger_entries_restaurant_occurred_idx"
    ON "public"."financial_ledger_entries"("tenant_id", "restaurant_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "financial_ledger_entries_account_idx"
    ON "public"."financial_ledger_entries"("tenant_id", "financial_account_id");

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_payout_transfers_tenant_id_uk"
    ON "public"."restaurant_payout_transfers"("tenant_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_payout_transfers_tenant_provider_transfer_uk"
    ON "public"."restaurant_payout_transfers"("tenant_id", "provider_transfer_id");
CREATE INDEX IF NOT EXISTS "restaurant_payout_transfers_tenant_id_idx"
    ON "public"."restaurant_payout_transfers"("tenant_id");
CREATE INDEX IF NOT EXISTS "restaurant_payout_transfers_schedule_idx"
    ON "public"."restaurant_payout_transfers"("tenant_id", "restaurant_id", "status", "scheduled_for");

CREATE UNIQUE INDEX IF NOT EXISTS "financial_reconciliation_runs_tenant_id_uk"
    ON "public"."financial_reconciliation_runs"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "financial_reconciliation_runs_tenant_id_idx"
    ON "public"."financial_reconciliation_runs"("tenant_id");
CREATE INDEX IF NOT EXISTS "financial_reconciliation_runs_restaurant_status_idx"
    ON "public"."financial_reconciliation_runs"("tenant_id", "restaurant_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "financial_reconciliation_items_tenant_id_uk"
    ON "public"."financial_reconciliation_items"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "financial_reconciliation_items_tenant_id_idx"
    ON "public"."financial_reconciliation_items"("tenant_id");
CREATE INDEX IF NOT EXISTS "financial_reconciliation_items_restaurant_status_idx"
    ON "public"."financial_reconciliation_items"("tenant_id", "restaurant_id", "status");
CREATE INDEX IF NOT EXISTS "financial_reconciliation_items_run_idx"
    ON "public"."financial_reconciliation_items"("tenant_id", "reconciliation_run_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'customer_order_payment_details_tenant_financial_account_fkey'
    ) THEN
        ALTER TABLE "public"."customer_order_payment_details"
            ADD CONSTRAINT "customer_order_payment_details_tenant_financial_account_fkey"
            FOREIGN KEY ("tenant_id", "financial_account_id")
            REFERENCES "public"."restaurant_financial_accounts"("tenant_id", "id")
            ON DELETE NO ACTION
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'restaurant_payments_tenant_financial_account_fkey'
    ) THEN
        ALTER TABLE "public"."restaurant_payments"
            ADD CONSTRAINT "restaurant_payments_tenant_financial_account_fkey"
            FOREIGN KEY ("tenant_id", "financial_account_id")
            REFERENCES "public"."restaurant_financial_accounts"("tenant_id", "id")
            ON DELETE NO ACTION
            ON UPDATE CASCADE;
    END IF;
END $$;

DROP TRIGGER IF EXISTS "trg_restaurant_financial_accounts_set_updated_at" ON "public"."restaurant_financial_accounts";
CREATE TRIGGER "trg_restaurant_financial_accounts_set_updated_at"
BEFORE UPDATE ON "public"."restaurant_financial_accounts"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_restaurant_financial_documents_set_updated_at" ON "public"."restaurant_financial_onboarding_documents";
CREATE TRIGGER "trg_restaurant_financial_documents_set_updated_at"
BEFORE UPDATE ON "public"."restaurant_financial_onboarding_documents"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_restaurant_financial_rules_set_updated_at" ON "public"."restaurant_financial_settlement_rules";
CREATE TRIGGER "trg_restaurant_financial_rules_set_updated_at"
BEFORE UPDATE ON "public"."restaurant_financial_settlement_rules"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_financial_ledger_entries_set_updated_at" ON "public"."financial_ledger_entries";
CREATE TRIGGER "trg_financial_ledger_entries_set_updated_at"
BEFORE UPDATE ON "public"."financial_ledger_entries"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_restaurant_payout_transfers_set_updated_at" ON "public"."restaurant_payout_transfers";
CREATE TRIGGER "trg_restaurant_payout_transfers_set_updated_at"
BEFORE UPDATE ON "public"."restaurant_payout_transfers"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_financial_reconciliation_runs_set_updated_at" ON "public"."financial_reconciliation_runs";
CREATE TRIGGER "trg_financial_reconciliation_runs_set_updated_at"
BEFORE UPDATE ON "public"."financial_reconciliation_runs"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_financial_reconciliation_items_set_updated_at" ON "public"."financial_reconciliation_items";
CREATE TRIGGER "trg_financial_reconciliation_items_set_updated_at"
BEFORE UPDATE ON "public"."financial_reconciliation_items"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();
