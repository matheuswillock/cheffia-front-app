---
phase: testing
title: MVP ordering vertical slice testing
description: Quality strategy for table to order to kitchen flow
feature: mvp-ordering-vertical-slice
status: in-progress
---

# Testing Strategy: MVP ordering vertical slice

## Coverage goals

- 100% of new domain rules and state transitions have focused tests.
- Every write use case covers success, validation, authorization, retry and concurrency.
- Every exposed table has local RLS isolation tests.
- The customer-to-kitchen journey is covered by Playwright with real local services.
- Mocks are limited to external providers; internal boundaries use real implementations or Supabase local.

## Unit tests (Bun)

### Domain and contracts

- [x] Valid order transitions are accepted and invalid transitions rejected.
- [x] Customer cancellation is rejected after `preparing`.
- [x] Kitchen rejection requires a reason and records the actor.
- [x] Client prices/totals are never authoritative.
- [x] Modifier min/max/availability rules are enforced.
- [x] Same idempotency key and payload returns the original result.
- [x] Same idempotency key with a different payload returns conflict.
- [x] Realtime deduplication and sequence-gap detection are deterministic.

## Integration tests (Supabase local)

- [x] Clean reset applies Prisma baseline and Supabase policies in order.
- [ ] A customer/session reads only the published menu for its table context.
- [ ] A customer cannot read or mutate another tenant's menu, table or order.
- [x] Order, item snapshots and Outbox event commit atomically.
- [x] A failed transaction leaves no order or event behind.
- [x] Two concurrent status transitions are guarded by optimistic status matching in the repository.
- [ ] Kitchen membership scopes reads and writes to its restaurant.
- [x] Operational tables remain inaccessible through unauthorized Data API reads.
- [ ] Re-running migrations produces no duplicate history or drift.

## Component tests (Vitest + React Testing Library)

- [x] Menu renders published items accessibly and requires a valid table session.
- [ ] Cart validates required modifiers and bounded notes.
- [ ] Submit handles loading, success, conflict, unavailable item and retry states.
- [x] Order status and kitchen states render text/semantic labels, not color alone.
- [x] Kitchen card exposes accessible transition controls; stale-state conflict remains for full E2E coverage.
- [ ] Disconnected/reconnecting state offers a safe resync path.

## End-to-end tests (Playwright)

- [ ] Resolve a valid QR/table session on a mobile viewport.
- [ ] Browse menu, configure modifiers, submit an order and see confirmation.
- [ ] Verify the order appears only in the correct kitchen OrderHub.
- [x] Advance order status and resync the customer snapshot through the status endpoint.
- [ ] Reload/reconnect and converge to the persisted order snapshot.
- [ ] Retry order submission without creating a duplicate.
- [ ] Attempt cross-tenant access and verify safe denial.

## Test data and boundaries

- Use deterministic local fixtures for two tenants, two restaurants, staff roles, tables, menu items and sessions.
- Use Supabase local for database/RLS; never production credentials or production data.
- Use isolated Playwright data and clean reset between critical flows.
- Mock only external payment/provider integrations, which are out of scope for this phase.

## Reporting and gates

Relevant commands are `bun run test`, `bun run test:components`, `bun run test:e2e`, `bun run test:e2e:local`, `bun run db:reset`, `bun run db:verify` and `bun run build`. New tests remain in `tests/unit`, `tests/integration` (run with `bun run test:integration:local` after `bun run db:reset`), `tests/components` and `tests/e2e`; regressions go in `tests/regressions`.

### Coverage gate

CI runs independent coverage gates for all three layers:

- Backend: `bun run test:backend:coverage` with Bun LCOV.
- Frontend: `bun run test:frontend:coverage` with Vitest/V8.
- E2E: `bun run test:e2e:coverage:local` with isolated Supabase/Auth fixtures and Playwright JSON results.
- Enforcement: `bun run coverage:gate` requires at least **90%** in backend, frontend and E2E; any layer below the threshold exits non-zero.

Latest local result: 53 Bun tests, 8 component tests, 3 E2E tests; backend `90.47%`, frontend `92.61%`, E2E `100%` — gate passed.

The promotion workflow avoids rerunning expensive gates on bot-created promotion PRs; human-created PRs still execute the complete validation suite.

## Manual validation

- [ ] Test customer flow on a narrow mobile viewport and keyboard-accessible controls.
- [ ] Test kitchen flow under rapid repeated clicks and two operators.
- [ ] Test reconnect after stopping/restarting the local realtime path.
- [ ] Validate dark/light tokens, contrast, focus and explicit status labels.
- [ ] Validate release smoke before `main` promotion.

## Performance and reliability

- [ ] Measure menu read, order creation and kitchen refresh in local/staging.
- [ ] Verify order creation remains one bounded transaction.
- [ ] Verify realtime failure delays notification but never loses persisted state.
- [ ] Verify logs expose correlation and outcome without secrets or sensitive payloads.

## Bug and regression policy

Every bug starts with a regression test in red, followed by the smallest fix, green verification and permanent retention of the test. No test may remove the real authorization, database or transport boundary it is intended to validate.
