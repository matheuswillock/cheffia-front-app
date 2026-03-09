-- User-scoped RLS for authenticated Cheffia profiles

CREATE OR REPLACE FUNCTION "public"."current_supabase_user_id"()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT auth.uid();
$$;

ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_self" ON "public"."user_profiles";
CREATE POLICY "user_profiles_select_self"
ON "public"."user_profiles"
FOR SELECT
USING ("supabase_user_id" = "public"."current_supabase_user_id"());

DROP POLICY IF EXISTS "user_profiles_insert_self" ON "public"."user_profiles";
CREATE POLICY "user_profiles_insert_self"
ON "public"."user_profiles"
FOR INSERT
WITH CHECK ("supabase_user_id" = "public"."current_supabase_user_id"());

DROP POLICY IF EXISTS "user_profiles_update_self" ON "public"."user_profiles";
CREATE POLICY "user_profiles_update_self"
ON "public"."user_profiles"
FOR UPDATE
USING ("supabase_user_id" = "public"."current_supabase_user_id"())
WITH CHECK ("supabase_user_id" = "public"."current_supabase_user_id"());

DROP POLICY IF EXISTS "user_profiles_delete_self" ON "public"."user_profiles";
CREATE POLICY "user_profiles_delete_self"
ON "public"."user_profiles"
FOR DELETE
USING ("supabase_user_id" = "public"."current_supabase_user_id"());
