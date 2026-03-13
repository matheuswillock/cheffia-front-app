ALTER TABLE "public"."customer_order_payment_details"
    ADD COLUMN IF NOT EXISTS "payer_name" TEXT,
    ADD COLUMN IF NOT EXISTS "payer_phone_number" TEXT,
    ADD COLUMN IF NOT EXISTS "payer_email" TEXT,
    ADD COLUMN IF NOT EXISTS "payer_document" TEXT;
