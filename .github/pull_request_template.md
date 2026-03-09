## Summary

- Describe the change and the affected backend migration task/slice.

## Validation

- [ ] `bun run lint`
- [ ] `bun run typecheck`
- [ ] `bun run build`
- [ ] `bun run test:migration`
- [ ] `bun run test:migration:strict` when targeting `migration-backend`, `develop`, or `main`
- [ ] `bun run artifacts:check` when the API contract/docs changed

## Backend Migration Checks

- [ ] Multi-tenant isolation reviewed
- [ ] Idempotency/replay behavior reviewed
- [ ] OpenAPI/collections updated when the contract changed
- [ ] Prisma/Supabase/RLS changes documented
- [ ] Required env vars and secrets documented

## Risks

- Describe rollout, compatibility, or operational risks.
