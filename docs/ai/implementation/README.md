---
phase: implementation
title: Implementation Guide
description: Technical implementation notes, patterns, and code guidelines
---

# Implementation Guide

## Development Setup

**How do we get started?**

- Prerequisites and dependencies
- Environment setup steps
- Configuration needed

Fase 0 uses Bun 1.4+, Prisma ORM 7.10.1 and the Supabase CLI. Copy `.env.example`
to a local ignored env file, start Supabase, then run `bun run db:reset` and
`bun run db:verify`. Prisma's runtime client reads `DATABASE_URL`; CLI migrations
read `DIRECT_URL`.

## Code Structure

**How is the code organized?**

- Directory structure
- Module organization
- Naming conventions

## Implementation Notes

**Key technical details to remember:**

### Core Features

- Feature 1: Implementation approach
- Feature 2: Implementation approach
- Feature 3: Implementation approach

### Patterns & Best Practices

- Design patterns being used
- Code style guidelines
- Common utilities/helpers

## Integration Points

**How do pieces connect?**

- API integration details
- Database connections
- Third-party service setup

The migration boundary is explicit: Prisma owns relational tables and constraints;
Supabase migrations own RLS, triggers and Supabase-specific objects. Application
startup never runs migrations.

## Error Handling

**How do we handle failures?**

- Error handling strategy
- Logging approach
- Retry/fallback mechanisms

## Performance Considerations

**How do we keep it fast?**

- Optimization strategies
- Caching approach
- Query optimization
- Resource management

Foundation operational events are persisted in the outbox table with a monotonic
database sequence so later Broadcast publishing and queue consumers can be added
without changing the transaction boundary.

## Security Notes

**What security measures are in place?**

- Authentication/authorization
- Input validation
- Data encryption
- Secrets management
- Tenant isolation is enforced in the database with RLS and composite tenant-aware
  foreign keys. Operational tables are server-owned and are not exposed to the
  authenticated Data API.
