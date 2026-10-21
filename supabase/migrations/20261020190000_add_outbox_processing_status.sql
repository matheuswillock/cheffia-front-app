-- PostgreSQL requires a committed transaction before a newly added enum value
-- may be referenced by indexes or DML in a later migration.
ALTER TYPE public.outbox_status ADD VALUE IF NOT EXISTS 'processing';
