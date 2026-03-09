-- Task 12: RLS for OrderHub + Payment tables
-- Depends on public.current_tenant_id() created in baseline policy script.

ALTER TABLE "public"."customer_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."customer_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."customer_order_payment_details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."restaurant_payments" ENABLE ROW LEVEL SECURITY;

-- customer_orders
DROP POLICY IF EXISTS "customer_orders_select_own_tenant" ON "public"."customer_orders";
CREATE POLICY "customer_orders_select_own_tenant"
ON "public"."customer_orders"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "customer_orders_insert_own_tenant" ON "public"."customer_orders";
CREATE POLICY "customer_orders_insert_own_tenant"
ON "public"."customer_orders"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "customer_orders_update_own_tenant" ON "public"."customer_orders";
CREATE POLICY "customer_orders_update_own_tenant"
ON "public"."customer_orders"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "customer_orders_delete_own_tenant" ON "public"."customer_orders";
CREATE POLICY "customer_orders_delete_own_tenant"
ON "public"."customer_orders"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- customer_order_items
DROP POLICY IF EXISTS "customer_order_items_select_own_tenant" ON "public"."customer_order_items";
CREATE POLICY "customer_order_items_select_own_tenant"
ON "public"."customer_order_items"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "customer_order_items_insert_own_tenant" ON "public"."customer_order_items";
CREATE POLICY "customer_order_items_insert_own_tenant"
ON "public"."customer_order_items"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "customer_order_items_update_own_tenant" ON "public"."customer_order_items";
CREATE POLICY "customer_order_items_update_own_tenant"
ON "public"."customer_order_items"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "customer_order_items_delete_own_tenant" ON "public"."customer_order_items";
CREATE POLICY "customer_order_items_delete_own_tenant"
ON "public"."customer_order_items"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- customer_order_payment_details
DROP POLICY IF EXISTS "customer_order_payment_details_select_own_tenant" ON "public"."customer_order_payment_details";
CREATE POLICY "customer_order_payment_details_select_own_tenant"
ON "public"."customer_order_payment_details"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "customer_order_payment_details_insert_own_tenant" ON "public"."customer_order_payment_details";
CREATE POLICY "customer_order_payment_details_insert_own_tenant"
ON "public"."customer_order_payment_details"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "customer_order_payment_details_update_own_tenant" ON "public"."customer_order_payment_details";
CREATE POLICY "customer_order_payment_details_update_own_tenant"
ON "public"."customer_order_payment_details"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "customer_order_payment_details_delete_own_tenant" ON "public"."customer_order_payment_details";
CREATE POLICY "customer_order_payment_details_delete_own_tenant"
ON "public"."customer_order_payment_details"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- restaurant_payments
DROP POLICY IF EXISTS "restaurant_payments_select_own_tenant" ON "public"."restaurant_payments";
CREATE POLICY "restaurant_payments_select_own_tenant"
ON "public"."restaurant_payments"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_payments_insert_own_tenant" ON "public"."restaurant_payments";
CREATE POLICY "restaurant_payments_insert_own_tenant"
ON "public"."restaurant_payments"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_payments_update_own_tenant" ON "public"."restaurant_payments";
CREATE POLICY "restaurant_payments_update_own_tenant"
ON "public"."restaurant_payments"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_payments_delete_own_tenant" ON "public"."restaurant_payments";
CREATE POLICY "restaurant_payments_delete_own_tenant"
ON "public"."restaurant_payments"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());
