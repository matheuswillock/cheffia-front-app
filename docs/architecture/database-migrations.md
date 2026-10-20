# Database migrations

## Decision

Cheffia uses Supabase PostgreSQL with one migration owner:

- `supabase/migrations/` owns the complete relational schema, enums, indexes,
  constraints, RLS, triggers, Realtime and Storage policies.
- Prisma owns only the ORM schema/client and runtime queries.

One object must have one owner. Prisma does not run migrations.

## Local workflow

```bash
bun install
bun run prisma:validate
bun run prisma:generate
bun run db:reset
bun run db:verify
```

Use `DATABASE_URL` for application traffic and keep database credentials outside
the repository. Schema changes are authored as Supabase migrations.

## Production workflow

Migrations are applied by the enabled Supabase GitHub Integration when `main`
is deployed:

```text
feature/bugfix → develop → release → main → Supabase migration deploy
```

GitHub Actions validates the application and local Supabase migration/RLS gates;
it does not apply production migrations. Prisma migration history is not used.
Migrations must not run from Next.js startup.

The current Cheffia production target is the configured Supabase project. The
Supabase integration applies the complete relational and RLS migration history;
connection strings are never committed.

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
