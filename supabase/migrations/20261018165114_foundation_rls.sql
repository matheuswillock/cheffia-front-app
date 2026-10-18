-- Foundation policies. Prisma owns the tables; Supabase owns RLS and triggers.
-- The application server performs writes through the server-side database client.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_set_updated_at ON public.tenants;
CREATE TRIGGER tenants_set_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS restaurants_set_updated_at ON public.restaurants;
CREATE TRIGGER restaurants_set_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS memberships_set_updated_at ON public.restaurant_memberships;
CREATE TRIGGER memberships_set_updated_at
BEFORE UPDATE ON public.restaurant_memberships
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS idempotency_keys_set_updated_at ON public.idempotency_keys;
CREATE TRIGGER idempotency_keys_set_updated_at
BEFORE UPDATE ON public.idempotency_keys
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS outbox_events_set_updated_at ON public.outbox_events;
CREATE TRIGGER outbox_events_set_updated_at
BEFORE UPDATE ON public.outbox_events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.has_tenant_membership(target_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_memberships membership
    WHERE membership.tenant_id = target_tenant_id
      AND membership.user_id = (SELECT auth.uid())
      AND membership.status = 'active'::public.membership_status
  );
$$;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.tenants, public.restaurants, public.restaurant_memberships TO authenticated;

-- Memberships expose only the caller's own membership through the Data API.
-- Administrative membership changes go through the authenticated server layer.
CREATE POLICY memberships_select_self
ON public.restaurant_memberships
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY tenants_select_member
ON public.tenants
FOR SELECT
TO authenticated
USING (public.has_tenant_membership(id));

CREATE POLICY restaurants_select_member
ON public.restaurants
FOR SELECT
TO authenticated
USING (public.has_tenant_membership(tenant_id));

-- These are server-owned operational tables. No direct Data API access is granted.
-- RLS remains enabled as defense in depth.

REVOKE ALL ON public.idempotency_keys FROM anon, authenticated;
REVOKE ALL ON public.outbox_events FROM anon, authenticated;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
