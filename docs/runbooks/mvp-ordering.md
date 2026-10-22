# Runbook: MVP ordering vertical slice

## Scope

This runbook covers the flow `QR → table session → published menu → order → kitchen → status`.
Payments, refunds, split and production data recovery are outside this runbook.

## Local verification

Run the gates with Bun:

```bash
bun run test
bun run db:reset && bun run test:integration:local
bun run test:realtime:local
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

### Realtime Broadcast authorization

`bun run test:realtime:local` proves that a table session and a kitchen member
receive only their own Broadcast topics. It needs the complete local stack
(Realtime, Auth, the API gateway and PostgREST), so it does not reuse
`db:reset`, which starts only the database. The runner starts the stack, applies
every migration, exports the test variables, and removes the containers and the
temporary workdir even when a test fails.

The suite starts with a positive control: a table session and a kitchen member
must receive a broadcast on their own topics. Denial tests count only after that
control passes, so "nothing arrived" cannot hide a broken subscription. CI runs
it in the `Realtime integration` job, in parallel with `Local database and RLS`.
Both are promotion gates.

### Real local E2E with Supabase

The critical QR-to-kitchen flow runs against an isolated local Supabase stack,
not mocks. It requires Bun, the Supabase CLI and a running Docker daemon:

```bash
bun --version
supabase --version
docker info
bun run test:e2e:local
```

On Fedora, install missing prerequisites with `dnf` or the official Supabase
CLI installation method; do not use `apt`. The command stops before creating
fixtures when any prerequisite is unavailable. It creates and removes its own
temporary Supabase workdir, database, Auth user, tenant, table and menu data.

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

## Incident: Broadcast or outbox unavailable

1. The persisted order remains authoritative; reload the relevant customer or KDS snapshot.
2. Inspect `/api/health` for pending, processing, failed and oldest pending outbox counts.
3. The Vercel minute cron calls the authenticated publisher. A processing event with an expired lease is safely claimed again.
4. After ten failed attempts an event becomes `failed`; fix delivery first, then replay it deliberately. Never reverse an order merely because Broadcast failed.
5. Keep channels private and public channel access disabled in Supabase. `CRON_SECRET` and `SUPABASE_SECRET_KEY` never belong in fixtures or logs.

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

## Outbox publisher

Order writes (`POST /api/public/orders`, the customer cancel route and the staff
transition route) publish their own Outbox events right after the response
(`after()` in `src/server/ordering/schedulePublish.ts`). The Vercel cron in
`vercel.json` calls `GET /api/internal/outbox/publish` every minute as a safety
net for events that an immediate attempt could not deliver; `POST` stays
available for manual runs. Both require `Authorization: Bearer $CRON_SECRET`.

- `CRON_SECRET` must be set in the Vercel project (name only; never commit the value).
- A per-minute schedule must be accepted by the project's Vercel plan. After the
  first production deploy, check the Crons tab; if the plan only allows daily
  runs, change the schedule in `vercel.json`. Latency then comes from the
  immediate publish, and the clients keep the periodic snapshot resync.
- A stuck event shows `status = 'processing'` with an expired `lease_expires_at`
  (reclaimed by the next run) or `status = 'failed'` after 10 attempts with
  `last_error` set. Do not edit rows by hand; fix the cause and let the publisher retry.
- On Fedora with Podman, the Supabase CLI needs the user socket. If
  `bun run test:e2e:local` reports it cannot reach the Docker daemon, run
  `systemctl --user restart podman.socket` and export
  `DOCKER_HOST=unix:///run/user/1000/podman/podman.sock`.
