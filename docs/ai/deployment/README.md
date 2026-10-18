---
phase: deployment
title: Deployment Strategy
description: Define deployment process, infrastructure, and release procedures
---

# Deployment Strategy

## Cheffia baseline

- Application: Next.js on Vercel.
- Database services: Supabase PostgreSQL/Auth/Storage/Realtime.
- Package manager and runtime: Bun. Do not use npm, npx, yarn or pnpm.
- Database migrations are applied by the serialized GitHub Actions production
  workflow when `main` is deployed, never from application startup.

## Infrastructure

**Where will the application run?**

- Hosting platform (AWS, GCP, Azure, etc.)
- Infrastructure components (servers, databases, etc.)
- Environment separation (dev, staging, production)

## Deployment Pipeline

**How do we deploy changes?**

### Build Process

- Build steps and commands
- Asset compilation/optimization
- Environment configuration

### CI/CD Pipeline

- Automated testing gates
- Build automation
- Deployment automation

## Environment Configuration

**What settings differ per environment?**

### Development

- Configuration details
- Local setup

### Staging

- Configuration details
- Testing environment

### Production

- Configuration details
- Monitoring setup

## Deployment Steps

**What's the release process?**

1. Pre-deployment checklist
2. Deployment execution steps
3. Post-deployment validation
4. Rollback procedure (if needed)

## Database Migrations

**How do we handle schema changes?**

- Prisma owns application-schema migrations in `prisma/migrations/`.
- Supabase CLI owns RLS, triggers, Realtime and Storage migrations in `supabase/migrations/`.
- GitHub Actions runs quality gates, local migration/RLS verification and the
  serialized production migration deployment.
- GitHub Actions is the single production migration orchestrator: Prisma first,
  then Supabase. The Supabase GitHub Integration must not also deploy production
  migrations.
- Vercel Git Integration publishes `develop` previews/staging and `main` production.
- Production schema changes are never made manually in the Supabase Dashboard after migration tracking begins.
- Rollback is forward-only: ship a corrective migration; do not edit an applied migration.
- Destructive changes use expand/backfill/contract and require an explicit review.

## Secrets Management

**How do we handle sensitive data?**

- Environment variables
- Secret storage solution
- Key rotation strategy
- The direct production database credential is stored as the protected GitHub
  environment secret `DIRECT_URL` and is used only by the serialized migration job.
- CI logs redact connection strings, tokens and keys; real credentials never enter source, migrations or docs.

## Rollback Plan

**What if something goes wrong?**

- Rollback triggers
- Rollback steps
- Communication plan
