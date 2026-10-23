-- The table-session broadcast policy reads orders and table_sessions as anon. anon has no
-- privilege on table_sessions (token_hash lives there), so the join failed with
-- "permission denied" and no table-session client could ever receive its own order.
-- This helper runs as the owner and takes no arguments: it answers only for the caller's
-- own table session, so anon gets no table grant and cannot probe other sessions or orders.
CREATE OR REPLACE FUNCTION public.can_receive_table_session_order_broadcast()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.table_sessions s ON s.id = o.session_id
    WHERE ('order:' || o.id::text) = realtime.topic()
      AND s.id::text = auth.jwt() ->> 'table_session_id'
      AND s.status = 'active'::public.table_session_status
      AND s.expires_at > now()
  );
$$;

REVOKE ALL ON FUNCTION public.can_receive_table_session_order_broadcast() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_receive_table_session_order_broadcast() TO anon;

DROP POLICY IF EXISTS "table sessions receive own order broadcasts" ON realtime.messages;
CREATE POLICY "table sessions receive own order broadcasts"
ON realtime.messages FOR SELECT TO anon
USING (public.can_receive_table_session_order_broadcast());
