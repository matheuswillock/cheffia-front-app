-- Multi-tenant RLS policies for baseline tables
-- Assumes JWT claim tenant_id is available for authenticated clients

CREATE OR REPLACE FUNCTION "public"."current_tenant_id"()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT CASE
        WHEN COALESCE(auth.jwt() ->> 'tenant_id', '') ~* '^[0-9a-f-]{36}$'
            THEN (auth.jwt() ->> 'tenant_id')::uuid
        ELSE NULL
    END;
$$;

ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."restaurants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."idempotency_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."asaas_webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."outbox_events" ENABLE ROW LEVEL SECURITY;

-- tenants
DROP POLICY IF EXISTS "tenants_select_own" ON "public"."tenants";
CREATE POLICY "tenants_select_own"
ON "public"."tenants"
FOR SELECT
USING ("id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "tenants_update_own" ON "public"."tenants";
CREATE POLICY "tenants_update_own"
ON "public"."tenants"
FOR UPDATE
USING ("id" = "public"."current_tenant_id"())
WITH CHECK ("id" = "public"."current_tenant_id"());

-- restaurants
DROP POLICY IF EXISTS "restaurants_select_own_tenant" ON "public"."restaurants";
CREATE POLICY "restaurants_select_own_tenant"
ON "public"."restaurants"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurants_insert_own_tenant" ON "public"."restaurants";
CREATE POLICY "restaurants_insert_own_tenant"
ON "public"."restaurants"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurants_update_own_tenant" ON "public"."restaurants";
CREATE POLICY "restaurants_update_own_tenant"
ON "public"."restaurants"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurants_delete_own_tenant" ON "public"."restaurants";
CREATE POLICY "restaurants_delete_own_tenant"
ON "public"."restaurants"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- idempotency_keys
DROP POLICY IF EXISTS "idempotency_select_own_tenant" ON "public"."idempotency_keys";
CREATE POLICY "idempotency_select_own_tenant"
ON "public"."idempotency_keys"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "idempotency_insert_own_tenant" ON "public"."idempotency_keys";
CREATE POLICY "idempotency_insert_own_tenant"
ON "public"."idempotency_keys"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "idempotency_update_own_tenant" ON "public"."idempotency_keys";
CREATE POLICY "idempotency_update_own_tenant"
ON "public"."idempotency_keys"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "idempotency_delete_own_tenant" ON "public"."idempotency_keys";
CREATE POLICY "idempotency_delete_own_tenant"
ON "public"."idempotency_keys"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- asaas_webhook_events
DROP POLICY IF EXISTS "asaas_webhooks_select_own_tenant" ON "public"."asaas_webhook_events";
CREATE POLICY "asaas_webhooks_select_own_tenant"
ON "public"."asaas_webhook_events"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "asaas_webhooks_insert_own_tenant" ON "public"."asaas_webhook_events";
CREATE POLICY "asaas_webhooks_insert_own_tenant"
ON "public"."asaas_webhook_events"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "asaas_webhooks_update_own_tenant" ON "public"."asaas_webhook_events";
CREATE POLICY "asaas_webhooks_update_own_tenant"
ON "public"."asaas_webhook_events"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "asaas_webhooks_delete_own_tenant" ON "public"."asaas_webhook_events";
CREATE POLICY "asaas_webhooks_delete_own_tenant"
ON "public"."asaas_webhook_events"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- outbox_events
DROP POLICY IF EXISTS "outbox_select_own_tenant" ON "public"."outbox_events";
CREATE POLICY "outbox_select_own_tenant"
ON "public"."outbox_events"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "outbox_insert_own_tenant" ON "public"."outbox_events";
CREATE POLICY "outbox_insert_own_tenant"
ON "public"."outbox_events"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "outbox_update_own_tenant" ON "public"."outbox_events";
CREATE POLICY "outbox_update_own_tenant"
ON "public"."outbox_events"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "outbox_delete_own_tenant" ON "public"."outbox_events";
CREATE POLICY "outbox_delete_own_tenant"
ON "public"."outbox_events"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());
