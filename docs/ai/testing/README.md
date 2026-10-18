---
phase: testing
title: Testing Strategy
description: Define testing approach, test cases, and quality assurance
---

# Testing Strategy

## Test Coverage Goals

**What level of testing do we aim for?**

- Unit test coverage target (default: 100% of new/changed code)
- Integration test scope (critical paths + error handling)
- End-to-end test scenarios (key user journeys)
- Alignment with requirements/design acceptance criteria

Fase 0 gate commands:

```bash
bun run prisma:validate
bun run typecheck
bun run test
bun run test:components
bun run test:e2e
bun run lint
bun run db:reset
bun run db:verify
bun run build
```

## Unit Tests

**What individual components need testing?**

### Foundation database

- [x] Clean database applies the Prisma baseline and Supabase policy migration.
- [x] All foundation tables have RLS enabled.
- [x] A member sees only its tenant, restaurant and own membership.
- [x] Operational tables reject direct authenticated Data API reads.

### CI test gate

- [x] CI executes backend/CI tests with `bun run test`.
- [x] CI executes component tests with Vitest and React Testing Library.
- [x] CI executes the Playwright E2E smoke suite.

### Migration validation and deployment ownership

- [x] Local Prisma and Supabase migration histories are checked by CI.
- [x] GitHub Actions serializes Prisma before Supabase production migrations.
- [ ] Supabase GitHub Integration production migration deploy is disabled.
- [ ] Production smoke test is configured after Vercel deployment.

## Integration Tests

**How do we test component interactions?**

- [ ] Integration scenario 1
- [ ] Integration scenario 2
- [ ] API endpoint tests
- [ ] Integration scenario 3 (failure mode / rollback)

## End-to-End Tests

**What user flows need validation?**

- [ ] User flow 1: [Description]
- [ ] User flow 2: [Description]
- [ ] Critical path testing
- [ ] Regression of adjacent features

## Test Data

**What data do we use for testing?**

- Test fixtures and mocks
- Seed data requirements
- Test database setup

## Test Reporting & Coverage

**How do we verify and communicate test results?**

- Coverage commands and thresholds (`bun test --coverage` when feature tests are introduced)
- Coverage gaps (files/functions below 100% and rationale)
- Links to test reports or dashboards
- Manual testing outcomes and sign-off

## Manual Testing

**What requires human validation?**

- UI/UX testing checklist (include accessibility)
- Browser/device compatibility
- Smoke tests after deployment

## Performance Testing

**How do we validate performance?**

- Load testing scenarios
- Stress testing approach
- Performance benchmarks

## Bug Tracking

**How do we manage issues?**

- Issue tracking process
- Bug severity levels
- Regression testing strategy
