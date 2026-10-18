# Async work and queues

## MVP decision

Cheffia will use Supabase Realtime for operational updates and an outbox for durable event intent. Vercel Queues is not a required dependency for the first operational slice.

Realtime is not a queue: it is a delivery signal. The database snapshot and the outbox event are authoritative. Clients reconnect, deduplicate event IDs and resynchronize from the database.

## Synchronous paths

Keep these operations inside a short database transaction:

- create order;
- snapshot menu item, price and modifiers;
- transition KDS state;
- update menu availability;
- open/close table session;
- append the outbox event.

## Queue-ready contract

Every future async event should include:

```text
event_id, tenant_id, aggregate_type, aggregate_id,
event_type, version, payload, available_at,
attempt_count, idempotency_key, correlation_id
```

Consumers must be at-least-once safe. A retry must not duplicate a payment effect, email, print job or import result.

## First queue candidates

1. Payment webhook ingestion and reconciliation.
2. CSV/Excel/link import with parsing, external fetches, OCR and AI.
3. Notification/email batches.
4. Printer retries.
5. Financial reconciliation and chargeback handling.

The queue adapter is a port in the application layer. The first implementation may dispatch inline or through a small outbox publisher; a later adapter can target Vercel Queues, pgmq or a dedicated worker without changing business rules.

## Why not add it now?

Vercel Queues provides at-least-once delivery and retry/visibility semantics, but it is still an additional beta/platform dependency. Introducing it before there is a durable workload would increase operational surface without improving the table-to-kitchen path. The MVP must first establish idempotency, outbox events, observability and resynchronization — the foundations required by any queue backend.
