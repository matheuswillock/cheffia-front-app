---
phase: requirements
title: MVP ordering vertical slice requirements
description: Requirements and acceptance criteria for table to order to kitchen flow
feature: mvp-ordering-vertical-slice
status: accepted
---

# Requirements: MVP ordering vertical slice

## Problem

The repository has the foundation, CI/CD and tenant primitives, but the product value is not yet proven through one connected operational journey. The restaurant needs a reliable path from a customer opening a table to the kitchen receiving and advancing the order. Static or mocked screens are insufficient because tenant isolation, server-side pricing, idempotency and status consistency are product behavior.

## Goals

- Define a verifiable journey: table/QR → published menu → order → kitchen → status.
- Preserve tenant, restaurant, table, item, price and status context end to end.
- Make order creation safe under retries and untrusted client input.
- Define contracts for Prisma, Supabase RLS and Outbox/Realtime.
- Derive tests before schema and UI implementation.

## Non-goals

- Consumer payment, split, transfer, refunds or chargebacks.
- Delivery, public orders without a table or inventory management.
- Custom WebSocket server or durable external queue.
- AI/imported menu onboarding.

## Users and use cases

1. **Customer:** Given a valid table QR, I can view the restaurant's published and available menu without installing an app.
2. **Customer:** I can submit a cart with valid modifiers and a bounded note, receiving a stable order result when the request is retried.
3. **Customer:** I can view order status and recover the current snapshot after a realtime disconnect.
4. **Kitchen:** I can see only orders for my restaurant and make valid status transitions.
5. **Manager:** I can manage the minimum table/menu state needed to publish a real menu and control whether new orders are accepted.
6. **Platform:** A user, request or event from another tenant cannot read, mutate or receive this flow's data.

### Status contract

```text
pending → confirmed → preparing → ready → delivered
                      ↘ rejected/cancelled
```

Customer cancellation is allowed before `preparing`; kitchen rejection is explicit and records a reason; every transition is authorized and persisted.

### Edge cases

- Same idempotency key and payload returns the original logical result.
- Same key with a different payload returns a conflict.
- Client-submitted price, tenant or status is ignored/rejected.
- Menu item becomes unavailable between render and submit.
- Two kitchen operators attempt the same transition concurrently.
- Realtime event is duplicated, delayed, out of order or missed during reconnect.

## Success criteria

- A real customer can open a valid table session and submit an order.
- The server validates menu, availability, modifiers, table and session before writing.
- The order stores immutable item/price/modifier snapshots.
- The order and its Outbox event commit atomically.
- Only authorized kitchen users see and transition orders for their restaurant.
- A retry cannot create a duplicate order.
- A reconnect converges to the persisted order snapshot.
- Cross-tenant integration/RLS tests fail for every read/write path.
- The critical Playwright flow passes in staging without mocks on the main path.

## Constraints and assumptions

- Bun is the only package manager/runner; do not use npm, npx, yarn or pnpm.
- Prisma owns relational tables, enums, constraints and indexes.
- Supabase migrations own RLS, triggers, Broadcast and Supabase-specific objects.
- Authenticated staff use server-side Supabase Auth sessions and persisted membership roles.
- Customers may be anonymous, but their table/session token is signed and scoped.
- Realtime is transport only; Postgres remains the source of truth and resync is mandatory.
- Every new exposed table receives RLS in the same change set.
- Secrets and production data are never used in tests or committed.
- The canonical Obsidian MVP spec remains authoritative for later Auth, subscription and payment gates.

## Alternatives

- **Recommended:** one vertical slice across domain, API, UI and tests; it exposes integration risks early.
- **Rejected:** build menu UI first; it postpones authorization, idempotency and kitchen contracts.
- **Rejected:** build only KDS first; it lacks a trustworthy customer/session boundary.

## Open items and decisions

- Provider choice and consumer payments are explicitly deferred to the financial gate.
- Visual composition follows `DESIGN.md` and Smooth UI policy; no new design system is needed in Marco 1.
- Final route names may change during design, but request/response invariants are stable.
