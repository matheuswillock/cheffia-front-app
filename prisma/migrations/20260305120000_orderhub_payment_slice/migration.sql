-- Task 12: OrderHub + Payment vertical slice
-- Adds tenant-scoped order and payment tables with strict cross-tenant FK constraints.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE "public"."order_status" AS ENUM ('pending', 'in_progress', 'ready', 'cancelled');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_payment_status') THEN
        CREATE TYPE "public"."order_payment_status" AS ENUM (
            'pending',
            'completed',
            'paid',
            'canceled',
            'expired',
            'processing',
            'refunded',
            'rejected',
            'failed',
            'unknown'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE "public"."payment_method" AS ENUM (
            'pix',
            'cash',
            'apple_pay',
            'google_pay',
            'debit_card',
            'samsung_pay',
            'credit_card',
            'bank_transfer',
            'other',
            'paypal',
            'unknown'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "public"."customer_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "order_date" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "table_number" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL,
    "total_to_pay" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "customer_orders_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "customer_orders_tenant_restaurant_fkey"
        FOREIGN KEY ("tenant_id", "restaurant_id")
        REFERENCES "public"."restaurants"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_orders_tenant_id_uk"
    ON "public"."customer_orders"("tenant_id", "id");

CREATE TABLE IF NOT EXISTS "public"."customer_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "customer_order_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "order_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order_status" "public"."order_status" NOT NULL DEFAULT 'pending',
    "price" DECIMAL(10,2) NOT NULL,
    "table_number" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "comments" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "customer_order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "customer_order_items_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "customer_order_items_tenant_order_fkey"
        FOREIGN KEY ("tenant_id", "customer_order_id")
        REFERENCES "public"."customer_orders"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."customer_order_payment_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "customer_order_id" UUID NOT NULL,
    "transaction_id" TEXT,
    "status" "public"."order_payment_status" NOT NULL DEFAULT 'pending',
    "method" "public"."payment_method" NOT NULL DEFAULT 'unknown',
    "amount" DECIMAL(10,2),
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "payment_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "customer_order_payment_details_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "customer_order_payment_details_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "customer_order_payment_details_tenant_order_fkey"
        FOREIGN KEY ("tenant_id", "customer_order_id")
        REFERENCES "public"."customer_orders"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."restaurant_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "customer_order_id" UUID NOT NULL,
    "payment_date" TIMESTAMPTZ(6),
    "amount" DECIMAL(10,2) NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "method" "public"."payment_method" NOT NULL,
    "status" "public"."order_payment_status" NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "payment_details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "restaurant_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "restaurant_payments_tenant_id_fkey"
        FOREIGN KEY ("tenant_id")
        REFERENCES "public"."tenants"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_payments_tenant_restaurant_fkey"
        FOREIGN KEY ("tenant_id", "restaurant_id")
        REFERENCES "public"."restaurants"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "restaurant_payments_tenant_customer_order_fkey"
        FOREIGN KEY ("tenant_id", "customer_order_id")
        REFERENCES "public"."customer_orders"("tenant_id", "id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_orders_tenant_id_uk"
    ON "public"."customer_orders"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "customer_orders_tenant_id_idx"
    ON "public"."customer_orders"("tenant_id");
CREATE INDEX IF NOT EXISTS "customer_orders_tenant_restaurant_idx"
    ON "public"."customer_orders"("tenant_id", "restaurant_id");
CREATE INDEX IF NOT EXISTS "customer_orders_tenant_restaurant_order_date_idx"
    ON "public"."customer_orders"("tenant_id", "restaurant_id", "order_date");

CREATE UNIQUE INDEX IF NOT EXISTS "customer_order_items_tenant_id_uk"
    ON "public"."customer_order_items"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "customer_order_items_tenant_id_idx"
    ON "public"."customer_order_items"("tenant_id");
CREATE INDEX IF NOT EXISTS "customer_order_items_tenant_customer_order_idx"
    ON "public"."customer_order_items"("tenant_id", "customer_order_id");
CREATE INDEX IF NOT EXISTS "customer_order_items_tenant_menu_item_idx"
    ON "public"."customer_order_items"("tenant_id", "menu_item_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'customer_order_payment_details_customer_order_id_uk'
    ) THEN
        ALTER TABLE "public"."customer_order_payment_details"
            ADD CONSTRAINT "customer_order_payment_details_customer_order_id_uk"
            UNIQUE ("customer_order_id");
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "customer_order_payment_details_tenant_id_uk"
    ON "public"."customer_order_payment_details"("tenant_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "customer_order_payment_details_tenant_transaction_uk"
    ON "public"."customer_order_payment_details"("tenant_id", "transaction_id");
CREATE INDEX IF NOT EXISTS "customer_order_payment_details_tenant_id_idx"
    ON "public"."customer_order_payment_details"("tenant_id");
CREATE INDEX IF NOT EXISTS "customer_order_payment_details_tenant_transaction_idx"
    ON "public"."customer_order_payment_details"("tenant_id", "transaction_id");

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_payments_tenant_id_uk"
    ON "public"."restaurant_payments"("tenant_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_payments_tenant_transaction_uk"
    ON "public"."restaurant_payments"("tenant_id", "transaction_id");
CREATE INDEX IF NOT EXISTS "restaurant_payments_tenant_id_idx"
    ON "public"."restaurant_payments"("tenant_id");
CREATE INDEX IF NOT EXISTS "restaurant_payments_tenant_restaurant_idx"
    ON "public"."restaurant_payments"("tenant_id", "restaurant_id");
CREATE INDEX IF NOT EXISTS "restaurant_payments_tenant_customer_order_idx"
    ON "public"."restaurant_payments"("tenant_id", "customer_order_id");

DROP TRIGGER IF EXISTS "trg_customer_orders_set_updated_at" ON "public"."customer_orders";
CREATE TRIGGER "trg_customer_orders_set_updated_at"
BEFORE UPDATE ON "public"."customer_orders"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_customer_order_items_set_updated_at" ON "public"."customer_order_items";
CREATE TRIGGER "trg_customer_order_items_set_updated_at"
BEFORE UPDATE ON "public"."customer_order_items"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_customer_order_payment_details_set_updated_at" ON "public"."customer_order_payment_details";
CREATE TRIGGER "trg_customer_order_payment_details_set_updated_at"
BEFORE UPDATE ON "public"."customer_order_payment_details"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();

DROP TRIGGER IF EXISTS "trg_restaurant_payments_set_updated_at" ON "public"."restaurant_payments";
CREATE TRIGGER "trg_restaurant_payments_set_updated_at"
BEFORE UPDATE ON "public"."restaurant_payments"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();
