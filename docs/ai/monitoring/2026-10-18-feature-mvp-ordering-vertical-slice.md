---
phase: monitoring
title: Monitoring & Observability
description: Define monitoring strategy, metrics, alerts, and incident response
---

# Monitoring & Observability

## Key Metrics

**What do we need to track?**

### Performance Metrics

- p50/p95 latency for menu, order creation, status and kitchen queue reads.
- Duration of the order transaction and number of database statements.
- Outbox publishing delay and pending event count.

### Business Metrics

- Orders created, rejected, cancelled and delivered by restaurant.
- Idempotency replays and conflicts.
- Kitchen transition success/conflict rates.

### Error Metrics

- `INVALID_ORDER_SESSION`, unavailable-item and invalid-modifier rates.
- `ORDER_STATE_CONFLICT` and authorization failures.
- Outbox failures, migration failures and Realtime reconnect/resync counts.

## Monitoring Tools

**What tools are we using?**

- Next.js/Vercel request logs and deployment checks.
- Supabase Postgres health, RLS and migration verification.
- CI gates: Bun, Vitest/RTL, Playwright, build and isolated database reset.

## Logging Strategy

**What do we log and how?**

- Include request ID, tenant ID, restaurant ID, aggregate ID, actor role and safe outcome code.
- Never log session/QR tokens, database URLs, Supabase keys, payment secrets or full request bodies.
- Keep logs bounded and redact provider/database errors before emitting them.

## Alerts & Notifications

**When and how do we get notified?**

### Critical Alerts

- Outbox backlog or repeated publish failures → stop rollout and inspect the outbox runbook.
- Cross-tenant/RLS verification failure → block promotion immediately.
- Order creation error spike → inspect idempotency and database transaction health.

### Warning Alerts

- Rising status resync or Realtime gap rate → check transport health; Postgres remains authoritative.
- Kitchen conflict rate increase → inspect duplicate operators or stale clients.

## Dashboards

**What do we visualize?**

- Health endpoint and deployment status.
- Order lifecycle, transition conflict and Outbox panels.
- Tenant-scoped error and latency views without customer secrets.

## Incident Response

**How do we handle issues?**

### On-Call Rotation

- Schedule and contacts
- Escalation path

### Incident Process

1. Detection and triage
2. Investigation and diagnosis
3. Resolution and mitigation
4. Post-mortem and learning

## Health Checks

**How do we verify system health?**

- `/api/health` for database connectivity.
- Isolated Supabase relational migration and RLS verification.
- Playwright API boundary smoke and homepage smoke on every CI run.
