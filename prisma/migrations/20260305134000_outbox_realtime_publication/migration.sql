-- Task 13: enable Supabase Realtime feed for outbox events

ALTER TABLE "public"."outbox_events" REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = 'outbox_events'
        ) THEN
            ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."outbox_events";
        END IF;
    END IF;
END $$;
