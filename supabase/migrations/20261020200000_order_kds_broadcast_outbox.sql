-- The outbox is the durable source of truth; Broadcast delivery is best effort.
ALTER TYPE public.outbox_status ADD VALUE IF NOT EXISTS 'processing';

ALTER TABLE public.outbox_events
  ADD COLUMN IF NOT EXISTS lease_token uuid,
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS outbox_publishable_idx
  ON public.outbox_events (status, available_at, sequence)
  WHERE status IN ('pending', 'processing');

-- Slice 3 uses private Broadcast; direct Postgres Changes is no longer a client transport.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
  END IF;
END $$;

-- Realtime owns this table. Only policies are managed here (no ALTER TABLE realtime.messages).
DROP POLICY IF EXISTS "table sessions receive own order broadcasts" ON realtime.messages;
CREATE POLICY "table sessions receive own order broadcasts"
ON realtime.messages FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.table_sessions s ON s.id = o.session_id
    WHERE ('order:' || o.id::text) = realtime.topic()
      AND s.id::text = auth.jwt() ->> 'table_session_id'
      AND s.status = 'active' AND s.expires_at > now()
  )
);

DROP POLICY IF EXISTS "restaurant members receive restaurant order broadcasts" ON realtime.messages;
CREATE POLICY "restaurant members receive restaurant order broadcasts"
ON realtime.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurant_memberships membership
    WHERE membership.user_id = auth.uid()
      AND membership.status = 'active'
      AND realtime.topic() = 'restaurant:' || membership.restaurant_id::text || ':orders'
  )
);
