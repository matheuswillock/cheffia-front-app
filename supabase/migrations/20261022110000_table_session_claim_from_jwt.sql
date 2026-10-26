-- has_table_session read the legacy request.jwt.claim.table_session_id setting. PostgREST only
-- exposes request.jwt.claims, so a valid table-session token never authorized a Data API read.
-- Read the claim through auth.jwt(), the same source the Broadcast policy uses.
CREATE OR REPLACE FUNCTION public.has_table_session(
  target_tenant_id uuid,
  target_restaurant_id uuid,
  target_session_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.table_sessions table_session
    WHERE table_session.tenant_id = target_tenant_id
      AND table_session.restaurant_id = target_restaurant_id
      AND table_session.id = target_session_id
      AND table_session.status = 'active'::public.table_session_status
      AND table_session.expires_at > now()
      AND table_session.id::text = NULLIF(auth.jwt() ->> 'table_session_id', '')
  );
$$;
