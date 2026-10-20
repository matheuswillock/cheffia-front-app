-- Ordering policies. Prisma owns the relational tables; Supabase owns RLS,
-- operational triggers and the authorization helpers used by Data API reads.

CREATE OR REPLACE FUNCTION public.has_restaurant_membership(
  target_tenant_id uuid,
  target_restaurant_id uuid,
  allowed_roles text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_memberships membership
    WHERE membership.tenant_id = target_tenant_id
      AND membership.restaurant_id = target_restaurant_id
      AND membership.user_id = (SELECT auth.uid())
      AND membership.status = 'active'::public.membership_status
      AND (
        allowed_roles IS NULL
        OR membership.role::text = ANY(allowed_roles)
      )
  );
$$;

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
      AND table_session.id::text = NULLIF(current_setting('request.jwt.claim.table_session_id', true), '')
  );
$$;

CREATE OR REPLACE FUNCTION public.set_ordering_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restaurant_tables_set_updated_at ON public.restaurant_tables;
CREATE TRIGGER restaurant_tables_set_updated_at
BEFORE UPDATE ON public.restaurant_tables
FOR EACH ROW EXECUTE FUNCTION public.set_ordering_updated_at();

DROP TRIGGER IF EXISTS table_sessions_set_updated_at ON public.table_sessions;
CREATE TRIGGER table_sessions_set_updated_at
BEFORE UPDATE ON public.table_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_ordering_updated_at();

DROP TRIGGER IF EXISTS menu_categories_set_updated_at ON public.menu_categories;
CREATE TRIGGER menu_categories_set_updated_at
BEFORE UPDATE ON public.menu_categories
FOR EACH ROW EXECUTE FUNCTION public.set_ordering_updated_at();

DROP TRIGGER IF EXISTS menu_items_set_updated_at ON public.menu_items;
CREATE TRIGGER menu_items_set_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.set_ordering_updated_at();

DROP TRIGGER IF EXISTS modifier_groups_set_updated_at ON public.modifier_groups;
CREATE TRIGGER modifier_groups_set_updated_at
BEFORE UPDATE ON public.modifier_groups
FOR EACH ROW EXECUTE FUNCTION public.set_ordering_updated_at();

DROP TRIGGER IF EXISTS modifiers_set_updated_at ON public.modifiers;
CREATE TRIGGER modifiers_set_updated_at
BEFORE UPDATE ON public.modifiers
FOR EACH ROW EXECUTE FUNCTION public.set_ordering_updated_at();

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_ordering_updated_at();

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_state_transitions ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON
  public.menu_categories,
  public.menu_items,
  public.modifier_groups,
  public.modifiers,
  public.menu_item_modifier_groups,
  public.orders,
  public.order_items,
  public.order_item_modifiers,
  public.order_state_transitions
TO authenticated;

-- Staff reads are scoped to an active membership in the exact restaurant.
CREATE POLICY restaurant_tables_select_staff
ON public.restaurant_tables
FOR SELECT TO authenticated
USING (public.has_restaurant_membership(tenant_id, restaurant_id));

CREATE POLICY table_sessions_select_staff
ON public.table_sessions
FOR SELECT TO authenticated
USING (public.has_restaurant_membership(tenant_id, restaurant_id));

CREATE POLICY menu_categories_select_staff
ON public.menu_categories
FOR SELECT TO authenticated
USING (public.has_restaurant_membership(tenant_id, restaurant_id));

CREATE POLICY menu_items_select_staff
ON public.menu_items
FOR SELECT TO authenticated
USING (public.has_restaurant_membership(tenant_id, restaurant_id));

CREATE POLICY modifier_groups_select_staff
ON public.modifier_groups
FOR SELECT TO authenticated
USING (public.has_restaurant_membership(tenant_id, restaurant_id));

CREATE POLICY modifiers_select_staff
ON public.modifiers
FOR SELECT TO authenticated
USING (public.has_restaurant_membership(tenant_id, restaurant_id));

CREATE POLICY menu_item_modifier_groups_select_staff
ON public.menu_item_modifier_groups
FOR SELECT TO authenticated
USING (public.has_restaurant_membership(tenant_id, restaurant_id));

CREATE POLICY orders_select_staff
ON public.orders
FOR SELECT TO authenticated
USING (public.has_restaurant_membership(tenant_id, restaurant_id));

CREATE POLICY orders_select_table_session
ON public.orders
FOR SELECT TO anon, authenticated
USING (public.has_table_session(tenant_id, restaurant_id, session_id));

CREATE POLICY order_items_select_staff
ON public.order_items
FOR SELECT TO authenticated
USING (public.has_restaurant_membership(tenant_id, restaurant_id));

CREATE POLICY order_items_select_table_session
ON public.order_items
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders parent_order
    WHERE parent_order.tenant_id = order_items.tenant_id
      AND parent_order.restaurant_id = order_items.restaurant_id
      AND parent_order.id = order_items.order_id
      AND public.has_table_session(
        parent_order.tenant_id,
        parent_order.restaurant_id,
        parent_order.session_id
      )
  )
);

CREATE POLICY order_item_modifiers_select_staff
ON public.order_item_modifiers
FOR SELECT TO authenticated
USING (public.has_restaurant_membership(tenant_id, restaurant_id));

CREATE POLICY order_item_modifiers_select_table_session
ON public.order_item_modifiers
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items parent_item
    JOIN public.orders parent_order
      ON parent_order.tenant_id = parent_item.tenant_id
     AND parent_order.restaurant_id = parent_item.restaurant_id
     AND parent_order.id = parent_item.order_id
    WHERE parent_item.tenant_id = order_item_modifiers.tenant_id
      AND parent_item.restaurant_id = order_item_modifiers.restaurant_id
      AND parent_item.id = order_item_modifiers.order_item_id
      AND public.has_table_session(
        parent_order.tenant_id,
        parent_order.restaurant_id,
        parent_order.session_id
      )
  )
);

CREATE POLICY order_state_transitions_select_staff
ON public.order_state_transitions
FOR SELECT TO authenticated
USING (public.has_restaurant_membership(tenant_id, restaurant_id));

-- Writes are server-owned. The application server performs authorization,
-- idempotency and transactional writes through its database boundary.
REVOKE ALL ON
  public.restaurant_tables,
  public.table_sessions,
  public.menu_categories,
  public.menu_items,
  public.modifier_groups,
  public.modifiers,
  public.menu_item_modifier_groups,
  public.orders,
  public.order_items,
  public.order_item_modifiers,
  public.order_state_transitions
FROM anon, authenticated;

-- Re-grant the read surface after revoking write privileges.
GRANT SELECT ON
  public.menu_categories,
  public.menu_items,
  public.modifier_groups,
  public.modifiers,
  public.menu_item_modifier_groups,
  public.orders,
  public.order_items,
  public.order_item_modifiers,
  public.order_state_transitions
TO authenticated;

GRANT SELECT ON public.orders, public.order_items, public.order_item_modifiers TO anon;

-- Realtime listens to persisted order updates. The client still resyncs from
-- Postgres after reconnects, duplicate events or sequence gaps.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'orders'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END
$$;
