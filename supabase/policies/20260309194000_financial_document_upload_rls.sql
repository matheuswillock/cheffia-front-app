-- Task 21: RLS for audited financial onboarding document uploads
-- Depends on public.current_tenant_id() created in baseline policy script.

ALTER TABLE "public"."restaurant_financial_onboarding_document_uploads" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurant_financial_document_uploads_select_own_tenant" ON "public"."restaurant_financial_onboarding_document_uploads";
CREATE POLICY "restaurant_financial_document_uploads_select_own_tenant"
ON "public"."restaurant_financial_onboarding_document_uploads"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_document_uploads_insert_own_tenant" ON "public"."restaurant_financial_onboarding_document_uploads";
CREATE POLICY "restaurant_financial_document_uploads_insert_own_tenant"
ON "public"."restaurant_financial_onboarding_document_uploads"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_document_uploads_update_own_tenant" ON "public"."restaurant_financial_onboarding_document_uploads";
CREATE POLICY "restaurant_financial_document_uploads_update_own_tenant"
ON "public"."restaurant_financial_onboarding_document_uploads"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_document_uploads_delete_own_tenant" ON "public"."restaurant_financial_onboarding_document_uploads";
CREATE POLICY "restaurant_financial_document_uploads_delete_own_tenant"
ON "public"."restaurant_financial_onboarding_document_uploads"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());
