---
phase: implementation
title: Implementation Guide
description: Technical implementation notes, patterns, and code guidelines
---

# Implementation Guide

## Development Setup

**How do we get started?**

- Install and run with Bun; generate Prisma client with `bun run prisma:generate`.
- Configure `DATABASE_URL`, `DIRECT_URL` and `TABLE_QR_SIGNING_SECRET` locally only.
- Prisma generates the ORM client; Supabase owns and applies the complete migration history.

## Code Structure

**How is the code organized?**

- `src/business/order/`: pure contracts, pricing, sessions and use cases.
- `src/server/ordering/`: Prisma adapters and transaction boundaries.
- `src/app/api/`: HTTP parsing and stable error envelopes.
- `src/components/Ordering/`: customer, kitchen and table-management interfaces.

## Implementation Notes

**Key technical details to remember:**

### Core Features

- Signed QR tokens resolve to short-lived table sessions; only token hashes persist.
- Order creation prices against the published catalog, snapshots values and writes Outbox atomically under idempotency.
- Kitchen transitions use the deterministic state machine and optimistic expected-status updates.

### Patterns & Best Practices

- Keep HTTP concerns in route handlers and business decisions in use cases.
- Use tenant + restaurant composite relations for sensitive entities.
- Treat polling/reconnect as snapshot resync; Postgres is authoritative.

## Integration Points

**How do pieces connect?**

- Public routes cover QR session, published menu, order creation and order status.
- Staff routes cover kitchen listing/transitions and manager table creation.
- Prisma owns relational tables; Supabase owns RLS, triggers and Realtime objects.

## Error Handling

**How do we handle failures?**

- Return stable domain codes such as `ORDER_STATE_CONFLICT` and `IDEMPOTENCY_KEY_REUSE`.
- Log only bounded operational messages; never log tokens, credentials or request bodies.
- Clients retry reads through snapshot resync; writes require the same idempotency key.

## Performance Considerations

**How do we keep it fast?**

- Keep menu/status reads restaurant/session scoped and use deterministic indexes.
- Use `no-store` for operational responses and short transactions for writes.

## Security Notes

**What security measures are in place?**

- Staff operations require an active Supabase user membership and role.
- Zod/domain validation rejects client totals, unknown items and invalid transitions.
- QR/session bearer values are hashed at rest and signing secrets stay in environment variables.

## Marco 5 implementation notes

- Published-menu reads now require the active table session ID and bearer token; a restaurant slug alone is insufficient.
- Direct anonymous Data API reads for catalog tables are disabled; the server route is the authorized public-menu boundary.
- Added deterministic realtime event processing for duplicate, stale and sequence-gap events. Snapshot resync remains authoritative.
- Added local database verification for atomic order/Outbox behavior and rollback cleanliness.
- Stripe initialization is lazy so deferred payment pages no longer break the application build when payment secrets are absent; payment use still fails explicitly when invoked without configuration.
- Public menu and order responses now emit a bounded `X-Request-Id`, preserving a safe caller ID or generating a UUID for correlation.
- Final local evidence: 47 Bun tests, 6 component tests, 2 Playwright smoke/API tests, build, typecheck, lint and isolated database verification.
- The `dev` script no longer forces Turbopack or a fixed Node inspector port; this avoids the generated Prisma `.js` import failure and inspector collisions seen in local development.
- CI now has separate backend, frontend and E2E coverage commands plus a hard 90% `coverage:gate`; the latest local gate passed backend 90.47%, frontend 92.61% and E2E 100%.
- `scripts/e2e-local.mjs` now provisions isolated Supabase/Auth fixtures and proves the real QR → order → kitchen → status flow; cleanup tolerates the Supabase CLI volume-prune warning after tests finish.
- Promotion jobs are now explicit and independent (`feature/bugfix → develop`, `develop → release`, `release → main`). Automatic bot-created PRs skip repeated quality/database jobs because the originating push already passed the full gates.
