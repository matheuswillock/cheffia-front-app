-- Backoffice internal users should never be directly readable from client-side anon/authenticated contexts.
-- Service role bypasses RLS for server-side trusted operations.

ALTER TABLE "public"."internal_users" ENABLE ROW LEVEL SECURITY;
