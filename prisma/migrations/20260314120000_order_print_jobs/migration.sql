CREATE TYPE "public"."order_print_job_status" AS ENUM ('claimed', 'printed', 'failed');

CREATE TABLE "public"."order_print_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "outbox_event_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "printer_id" TEXT NOT NULL,
    "status" "public"."order_print_job_status" NOT NULL DEFAULT 'claimed',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "payload_snapshot" JSONB,
    "claimed_at" TIMESTAMPTZ(6),
    "printed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "order_print_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_print_jobs_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_print_jobs_outbox_event_id_fkey"
      FOREIGN KEY ("outbox_event_id") REFERENCES "public"."outbox_events"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_print_jobs_restaurant_id_fkey"
      FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "order_print_jobs_tenant_event_printer_uk"
    ON "public"."order_print_jobs"("tenant_id", "outbox_event_id", "printer_id");

CREATE INDEX "order_print_jobs_tenant_restaurant_status_idx"
    ON "public"."order_print_jobs"("tenant_id", "restaurant_id", "status");

CREATE INDEX "order_print_jobs_tenant_created_at_idx"
    ON "public"."order_print_jobs"("tenant_id", "created_at");

DROP TRIGGER IF EXISTS "trg_order_print_jobs_set_updated_at" ON "public"."order_print_jobs";
CREATE TRIGGER "trg_order_print_jobs_set_updated_at"
BEFORE UPDATE ON "public"."order_print_jobs"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();
