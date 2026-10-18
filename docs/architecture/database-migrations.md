# Database migrations

## Decision

Cheffia uses Supabase PostgreSQL with two versioned migration layers:

- `prisma/migrations/` owns application tables, relations, enums, indexes and constraints.
- `supabase/migrations/` owns RLS, triggers, Realtime Broadcast, Storage policies and Supabase-specific functions.

One object must have one owner. Do not create the same table or policy in both systems.

## Local workflow

```bash
bun install
bun run prisma:validate
bun run prisma:generate
bun run prisma:migrate:dev -- --name add_feature
supabase migration new add_feature_policy
bun run db:reset
bun run db:verify
```

Use a direct Supabase connection for Prisma CLI migrations (`DIRECT_URL`) and a pooled connection for application traffic (`DATABASE_URL`). Never commit either value.

## Production workflow

Migrations are applied automatically by the production GitHub Actions workflow
when `main` is deployed:

```text
feature/bugfix → develop → main → Prisma migration deploy → Supabase migration deploy
```

GitHub Actions is the single production migration orchestrator. It validates both
histories, applies `prisma/migrations/` first and then applies
`supabase/migrations/`. Supabase remains the owner of the second layer, while the
Supabase GitHub Integration's automatic production migration step is disabled to
avoid concurrent `supabase db push` jobs. Migrations must not run from Next.js
startup.

Supabase and Vercel integrations react independently to the same push. The
application must therefore remain compatible with the previous schema during
rollout (`expand/contract`). If strict migration-before-application ordering is
required, replace the direct Vercel Git Integration production deploy with a
post-migration deploy workflow.

The production database is never edited manually after migration tracking begins.

## Prisma version policy

Prisma ORM `7.10.1` is the production baseline. Prisma ORM 8 is currently a release candidate and is not adopted for the MVP merely because it is newer. Re-evaluate after GA and after validating transaction, nested-write and driver-adapter compatibility.

## Safety

- Review SQL and destructive operations in pull requests.
- Prefer expand/contract migrations.
- Backfill before adding `NOT NULL` constraints.
- Keep deployed application code compatible with the previous schema during rollout.
- Treat any database credential found in old branches or documentation as compromised and rotate it; do not reuse it.
