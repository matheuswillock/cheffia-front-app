-- Task 21: RLS for Asaas financial domain tables
-- Depends on public.current_tenant_id() created in baseline policy script.

ALTER TABLE "public"."restaurant_financial_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."restaurant_financial_onboarding_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."restaurant_financial_settlement_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."financial_ledger_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."restaurant_payout_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."financial_reconciliation_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."financial_reconciliation_items" ENABLE ROW LEVEL SECURITY;

-- restaurant_financial_accounts
DROP POLICY IF EXISTS "restaurant_financial_accounts_select_own_tenant" ON "public"."restaurant_financial_accounts";
CREATE POLICY "restaurant_financial_accounts_select_own_tenant"
ON "public"."restaurant_financial_accounts"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_accounts_insert_own_tenant" ON "public"."restaurant_financial_accounts";
CREATE POLICY "restaurant_financial_accounts_insert_own_tenant"
ON "public"."restaurant_financial_accounts"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_accounts_update_own_tenant" ON "public"."restaurant_financial_accounts";
CREATE POLICY "restaurant_financial_accounts_update_own_tenant"
ON "public"."restaurant_financial_accounts"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_accounts_delete_own_tenant" ON "public"."restaurant_financial_accounts";
CREATE POLICY "restaurant_financial_accounts_delete_own_tenant"
ON "public"."restaurant_financial_accounts"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- restaurant_financial_onboarding_documents
DROP POLICY IF EXISTS "restaurant_financial_documents_select_own_tenant" ON "public"."restaurant_financial_onboarding_documents";
CREATE POLICY "restaurant_financial_documents_select_own_tenant"
ON "public"."restaurant_financial_onboarding_documents"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_documents_insert_own_tenant" ON "public"."restaurant_financial_onboarding_documents";
CREATE POLICY "restaurant_financial_documents_insert_own_tenant"
ON "public"."restaurant_financial_onboarding_documents"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_documents_update_own_tenant" ON "public"."restaurant_financial_onboarding_documents";
CREATE POLICY "restaurant_financial_documents_update_own_tenant"
ON "public"."restaurant_financial_onboarding_documents"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_documents_delete_own_tenant" ON "public"."restaurant_financial_onboarding_documents";
CREATE POLICY "restaurant_financial_documents_delete_own_tenant"
ON "public"."restaurant_financial_onboarding_documents"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- restaurant_financial_settlement_rules
DROP POLICY IF EXISTS "restaurant_financial_rules_select_own_tenant" ON "public"."restaurant_financial_settlement_rules";
CREATE POLICY "restaurant_financial_rules_select_own_tenant"
ON "public"."restaurant_financial_settlement_rules"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_rules_insert_own_tenant" ON "public"."restaurant_financial_settlement_rules";
CREATE POLICY "restaurant_financial_rules_insert_own_tenant"
ON "public"."restaurant_financial_settlement_rules"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_rules_update_own_tenant" ON "public"."restaurant_financial_settlement_rules";
CREATE POLICY "restaurant_financial_rules_update_own_tenant"
ON "public"."restaurant_financial_settlement_rules"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_financial_rules_delete_own_tenant" ON "public"."restaurant_financial_settlement_rules";
CREATE POLICY "restaurant_financial_rules_delete_own_tenant"
ON "public"."restaurant_financial_settlement_rules"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- financial_ledger_entries
DROP POLICY IF EXISTS "financial_ledger_entries_select_own_tenant" ON "public"."financial_ledger_entries";
CREATE POLICY "financial_ledger_entries_select_own_tenant"
ON "public"."financial_ledger_entries"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "financial_ledger_entries_insert_own_tenant" ON "public"."financial_ledger_entries";
CREATE POLICY "financial_ledger_entries_insert_own_tenant"
ON "public"."financial_ledger_entries"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "financial_ledger_entries_update_own_tenant" ON "public"."financial_ledger_entries";
CREATE POLICY "financial_ledger_entries_update_own_tenant"
ON "public"."financial_ledger_entries"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "financial_ledger_entries_delete_own_tenant" ON "public"."financial_ledger_entries";
CREATE POLICY "financial_ledger_entries_delete_own_tenant"
ON "public"."financial_ledger_entries"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- restaurant_payout_transfers
DROP POLICY IF EXISTS "restaurant_payout_transfers_select_own_tenant" ON "public"."restaurant_payout_transfers";
CREATE POLICY "restaurant_payout_transfers_select_own_tenant"
ON "public"."restaurant_payout_transfers"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_payout_transfers_insert_own_tenant" ON "public"."restaurant_payout_transfers";
CREATE POLICY "restaurant_payout_transfers_insert_own_tenant"
ON "public"."restaurant_payout_transfers"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_payout_transfers_update_own_tenant" ON "public"."restaurant_payout_transfers";
CREATE POLICY "restaurant_payout_transfers_update_own_tenant"
ON "public"."restaurant_payout_transfers"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "restaurant_payout_transfers_delete_own_tenant" ON "public"."restaurant_payout_transfers";
CREATE POLICY "restaurant_payout_transfers_delete_own_tenant"
ON "public"."restaurant_payout_transfers"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- financial_reconciliation_runs
DROP POLICY IF EXISTS "financial_reconciliation_runs_select_own_tenant" ON "public"."financial_reconciliation_runs";
CREATE POLICY "financial_reconciliation_runs_select_own_tenant"
ON "public"."financial_reconciliation_runs"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "financial_reconciliation_runs_insert_own_tenant" ON "public"."financial_reconciliation_runs";
CREATE POLICY "financial_reconciliation_runs_insert_own_tenant"
ON "public"."financial_reconciliation_runs"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "financial_reconciliation_runs_update_own_tenant" ON "public"."financial_reconciliation_runs";
CREATE POLICY "financial_reconciliation_runs_update_own_tenant"
ON "public"."financial_reconciliation_runs"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "financial_reconciliation_runs_delete_own_tenant" ON "public"."financial_reconciliation_runs";
CREATE POLICY "financial_reconciliation_runs_delete_own_tenant"
ON "public"."financial_reconciliation_runs"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());

-- financial_reconciliation_items
DROP POLICY IF EXISTS "financial_reconciliation_items_select_own_tenant" ON "public"."financial_reconciliation_items";
CREATE POLICY "financial_reconciliation_items_select_own_tenant"
ON "public"."financial_reconciliation_items"
FOR SELECT
USING ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "financial_reconciliation_items_insert_own_tenant" ON "public"."financial_reconciliation_items";
CREATE POLICY "financial_reconciliation_items_insert_own_tenant"
ON "public"."financial_reconciliation_items"
FOR INSERT
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "financial_reconciliation_items_update_own_tenant" ON "public"."financial_reconciliation_items";
CREATE POLICY "financial_reconciliation_items_update_own_tenant"
ON "public"."financial_reconciliation_items"
FOR UPDATE
USING ("tenant_id" = "public"."current_tenant_id"())
WITH CHECK ("tenant_id" = "public"."current_tenant_id"());

DROP POLICY IF EXISTS "financial_reconciliation_items_delete_own_tenant" ON "public"."financial_reconciliation_items";
CREATE POLICY "financial_reconciliation_items_delete_own_tenant"
ON "public"."financial_reconciliation_items"
FOR DELETE
USING ("tenant_id" = "public"."current_tenant_id"());
