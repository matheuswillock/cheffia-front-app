---
phase: planning
title: MVP ordering vertical slice plan
description: Ordered implementation plan for table to order to kitchen flow
feature: mvp-ordering-vertical-slice
status: in-progress
---

# Plan: MVP ordering vertical slice

## Milestones

- [x] **Marco 1 — Requirements and contracts:** close user stories, state machine, QR/session, API envelopes, authorization and test scenarios.
- [x] **Marco 2 — Domain and database:** Prisma models, Supabase RLS/triggers, idempotency, audit and Outbox migrations.
- [x] **Marco 3 — Use cases and API:** menu/session/order/status contracts with real transactions and authorization.
- [x] **Marco 4 — Operational interfaces:** customer menu/cart/status, kitchen OrderHub and minimum manager configuration.
- [ ] **Marco 5 — Verification and rollout:** unit/integration/component/E2E gates, staging smoke, observability and release promotion.

## Marco 1 task breakdown

- [x] M1.1 Create feature documents and link the canonical Obsidian MVP specification.
- [x] M1.2 Define problem, users, goals, non-goals, order states and edge cases.
- [x] M1.3 Define provisional API contracts, Tenant Context, idempotency and Realtime invariants.
- [x] M1.4 Derive unit, integration, component and E2E scenarios.
- [x] M1.5 Review existing routes/components and mark mock versus real behavior.
- [x] M1.6 Approve the Marco 1 gate before creating migrations or domain code.

### Marco 1 audit findings

- `src/app/restaurant/menu/[slug]/page.tsx` composes menu/cart/status UI but does not yet establish the new public table/session contract.
- `src/app/restaurant/order-hub/[slug]/page.tsx` uses the legacy `useRestaurantWebSocket`; it is not an acceptable MVP realtime boundary.
- `src/api/menu.ts` and `src/api/restaurant.ts` call legacy external API routes rather than the new Next.js use cases.
- `src/models/menuModels/mockedModels.ts` and `src/hooks/useOrderStore.ts` are reference/mock state, not persistence or authorization.
- `src/app/order/checkout/page.tsx` is Stripe-oriented and remains outside this phase because consumer payments are deferred.
- `src/server/infra/prisma/client.ts` and Supabase SSR clients are reusable infrastructure, but no order/menu domain models exist in `prisma/schema.prisma` yet.

Decision: preserve existing screens as migration references, but implement the new contracts behind feature-local modules and replace legacy boundaries incrementally.

## Implementation checkpoint

- [x] Added the first red/green domain contract test for order status transitions.
- [x] Added deterministic `transitionOrder` with role checks and rejection-reason validation.
- [ ] Replace the legacy randomized `orderBusiness.ts` only after persistence and API contracts exist.

Evidence: `bun test tests/unit/order-state.test.ts` and `bun run test` pass; typecheck passes. Existing lint warnings are pre-existing legacy warnings and were not introduced by this change.

## Subsequent tasks

### Marco 2 — Domain and database

- [x] M2.1 Reconcile planned entities with existing tenant/membership/idempotency/outbox schema.
- [x] M2.2 Add Prisma models and migration for tables, menu, orders, snapshots and transitions.
- [x] M2.3 Add Supabase RLS/triggers and tests for every exposed table.
- [x] M2.4 Verify clean/repeated migration and cross-tenant isolation locally.

### Marco 2 implementation checkpoint

- Added `RestaurantTable`, `TableSession`, catalog/modifier entities, `Order` snapshots and `OrderStateTransition` to `prisma/schema.prisma`.
- Added Prisma migration `20261018170000_ordering_domain` with tenant + restaurant composite foreign keys and database checks for monetary, quantity and modifier bounds.
- Added Supabase migration `20261018170000_ordering_rls.sql` with RLS on every new table, staff restaurant scoping, published-menu policies, table-session order reads, updated-at triggers and server-owned writes.
- Extended `scripts/verify-foundation.mjs` so the local database gate checks ordering tables, RLS, staff policy presence and cross-tenant order visibility.

Evidence: isolated Supabase local run applied Prisma migrations and both Supabase migrations; `bun run db:verify` passed. `bun test tests/ci/db-reset.test.ts tests/ci/order-schema.test.ts`, Prisma validation and typecheck passed.

### Marco 3 — Use cases and API

- [x] M3.1 Implement signed table/session resolution.
- [x] M3.2 Implement published menu query.
- [x] M3.3 Implement idempotent order creation with snapshots and Outbox.
- [x] M3.4 Implement kitchen listing and optimistic status transitions.

### Marco 3 implementation checkpoint

- Added signed QR/table session resolution, bearer session hashing and the `/table/[signedToken]` landing route.
- Added published menu repository/use case and `GET /api/public/restaurants/{slug}/menu`.
- Added server-side catalog pricing, modifier validation, immutable order snapshots, transactional idempotency and Outbox creation through `POST /api/public/orders`.
- Added session-scoped customer status reads, staff kitchen listing, role-scoped optimistic transitions and transition Outbox events.
- Added the customer ordering flow and kitchen OrderHub components with loading/error states, accessible labels and polling-based snapshot resync. Legacy WebSocket behavior is no longer used by the active OrderHub route.

Evidence: 37 Bun tests pass, component tests pass, Prisma/typecheck pass, and production build compiles the new routes before the repository's pre-existing Stripe configuration failure during page data collection. `bun run lint` reports only existing repository warnings plus no blocking errors.

### Marco 4 — Interfaces

- [x] M4.1 Build customer menu/cart/confirmation/status components.
- [x] M4.2 Build kitchen OrderHub and accessible transition controls.
- [x] M4.3 Build minimum manager table/QR control; legacy catalog editing remains a separate migration surface.
- [x] M4.4 Add reconnect/resync and all loading/error states.

### Marco 5 — Verification and rollout

- [ ] M5.1 Complete unit, integration, component and E2E coverage.
- [ ] M5.2 Run local and release smoke tests.
- [ ] M5.3 Add observability/runbook evidence and update Obsidian progress.
- [ ] M5.4 Promote feature → develop → release → main only after all gates pass.

### Marco 5 implementation checkpoint

- Added session enforcement to published-menu reads; QR/session context is now required before menu access.
- Removed direct anonymous catalog-table reads from the Supabase RLS surface; public menu access is server-owned.
- Added deterministic realtime event handling for duplicates, stale events and sequence gaps.
- Extended the local database verification gate with order/Outbox atomicity and rollback checks.
- Made deferred Stripe initialization lazy so `bun run build` succeeds without payment secrets; payment execution still fails explicitly when unconfigured.

Evidence so far: the hard 90% gate passes with backend 90.47%, frontend 92.61% and E2E 100%. The local real-data E2E covers QR/session → order → kitchen login/confirmation → customer status resync. Realtime transport/reconnect validation and branch promotion remain open; the operational runbook and safe request correlation are documented/implemented.

## Dependencies and blockers

- Marco 1 must be accepted before schema changes.
- Auth/session and tenant context are prerequisites for protected manager/kitchen operations.
- Catalog and table/session data are prerequisites for order creation.
- Order persistence is a prerequisite for KDS and Realtime.
- Consumer payments, split and provider homologation are explicitly deferred.
- No production migration is allowed outside the `main` push workflow.

## Validation evidence

Each task must link tests, migration status, CI run or manual evidence. Repository gates use Bun, Vitest/RTL, Playwright and Supabase local; production uses serialized Prisma → Supabase migrations.

## Risks and mitigation

- **Mock/UI drift:** audit routes before implementing; require E2E against real local data.
- **Tenant leakage:** compose tenant-aware keys, RLS tests and server-side Tenant Context.
- **Duplicate orders:** require Idempotency-Key and transaction-level uniqueness.
- **Realtime loss:** persist Outbox and always support snapshot resync.
- **Schema drift:** separate Prisma/Supabase ownership and verify clean/repeated migrations.
