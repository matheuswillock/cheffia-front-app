# Runbook: MVP ordering vertical slice

## Scope

This runbook covers the flow `QR → table session → published menu → order → kitchen → status`.
Payments, refunds, split and production data recovery are outside this runbook.

## Local verification

Run the gates with Bun:

```bash
bun test tests/ci tests/unit tests/integration tests/regressions
bun run test:components
bun run test:e2e
bun run build
bun run typecheck
```

For the database gate, use an isolated Supabase instance. The approved flow is:

```text
Supabase relational schema → Supabase RLS/triggers → verification
```

Do not point local tests at production or at a shared database.

## Incident: order creation failure

1. Check the HTTP error code and request correlation data.
2. If the client retries, reuse the same `Idempotency-Key`.
3. Check `idempotency_keys` and `outbox_events` for the tenant/restaurant scope.
4. Do not manually insert a second order; the key must replay or return a conflict.
5. If the transaction failed, verify that no partial order, item or Outbox rows remain.

## Incident: stale kitchen transition

1. Treat `ORDER_STATE_CONFLICT` as a stale snapshot, not as permission to retry blindly.
2. Reload the kitchen queue.
3. Apply the next transition only from the current persisted status.
4. Preserve the transition audit row created by the winning operator.

## Incident: customer status is stale

1. Treat the persisted status endpoint as the source of truth.
2. Re-run the session-scoped status request.
3. If a Realtime event has a sequence gap or duplicate, discard it and resync.
4. Never infer a status transition from a missing or out-of-order event.

## Incident: migration failure

1. Stop promotion; do not retry production migrations manually.
2. Capture the sanitized workflow output and migration name.
3. Verify whether Prisma or Supabase failed.
4. Repair the migration in a new change set and rerun local isolated reset.
5. Production execution remains owned by the `main` GitHub Actions workflow.

## Security reminders

- Never log QR tokens, session bearer tokens, database URLs, Supabase keys or payment secrets.
- Public menu and order routes require table-session context.
- Staff routes require an active restaurant membership and role.
- RLS and tenant-aware composite relations remain mandatory even when the server route already authorizes access.
