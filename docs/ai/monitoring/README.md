---
phase: monitoring
title: Monitoring & Observability
description: Define monitoring strategy, metrics, alerts, and incident response
---

# Monitoring & Observability

Fase 0 baseline: `GET /api/health` is a no-store readiness check. It verifies
database connectivity without returning connection details or exception content;
it returns `200` only when the database probe succeeds and `503` otherwise.

## Key Metrics

**What do we need to track?**

### Performance Metrics

- Response time/latency
- Throughput/requests per second
- Resource utilization (CPU, memory, disk)

### Business Metrics

- User engagement metrics
- Conversion/success rates
- Feature usage

### Error Metrics

- Error rates by type
- Failed requests
- Exception tracking

## Monitoring Tools

**What tools are we using?**

- Application monitoring (APM)
- Infrastructure monitoring
- Log aggregation
- User analytics

## Logging Strategy

**What do we log and how?**

- Log levels and categories
- Structured logging format
- Log retention policy
- Sensitive data handling

Logs are structured around an event name and safe metadata. Never log request
headers, cookies, authorization values, database URLs, webhook bodies or payment
provider secrets. Migration scripts redact connection strings and tokens on error.

## Alerts & Notifications

**When and how do we get notified?**

### Critical Alerts

- Alert 1: [Condition] → [Action]
- Alert 2: [Condition] → [Action]

### Warning Alerts

- Alert 1: [Condition] → [Action]
- Alert 2: [Condition] → [Action]

## Dashboards

**What do we visualize?**

- System health dashboard
- Business metrics dashboard
- Custom views per team/role

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

- Endpoint health checks
- Dependency checks
- Automated smoke tests

The post-deploy smoke test must call `/api/health` and fail when the response is
not `200`. The database foundation test (`bun run db:verify`) covers migration
tracking, RLS enablement, tenant isolation and operational-table access.
