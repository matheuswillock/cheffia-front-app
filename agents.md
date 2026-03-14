<!-- CANONICAL AI GOVERNANCE FILE: agents.md -->
# Cheffia Front App - AI Implementation Governance

**Version:** 2.1.0  
**Last Updated:** 2026-03-13  
**Canonical Source:** `agents.md` (single source of truth)  
**Adapter Files:** generated with `bun run governance:sync`

This document defines implementation governance for AI agents in this repository. It is intentionally normative.

## Normative Keywords

- **MUST**: mandatory rule.
- **MUST NOT**: prohibited behavior.
- **SHOULD**: recommended default unless there is a justified exception.
- **LEGACY EXCEPTIONS**: temporary, explicit deviations listed in `.governance/ai-governance.config.json`.
- **FOR NEW FEATURES**: rules that apply to all net-new feature work.

## Source of Truth and Distribution

- Agents **MUST** treat `agents.md` as the canonical instruction file.
- Adapter files (`.github/copilot-instructions.md`, `.cursor/rules/cheffia-front-agents.mdc`, `CLAUDE.md`, `AGENTS.md`) **MUST** be generated from this file.
- Team members and agents **MUST NOT** manually edit generated adapter files.
- `AGENTS.md` is treated as a logical alias of `agents.md` for cross-agent compatibility and case-collision safety.
- Regenerate adapters with:

```bash
bun run governance:sync
```

- Validate governance rules with:

```bash
bun run governance:check
```

## Core Architecture

### Clean Architecture (Critical, FOR NEW FEATURES)

Target direction:

`route/ui -> useCases -> services -> infra`

- `app/api/useCases/**` **MUST** hold use-case orchestration and **MUST NOT** import from page/UI layers.
- `app/api/services/**` **MUST** hold reusable business/domain logic and **MUST NOT** become an HTTP layer.
- `app/api/services/domain/**` **MUST** remain framework-agnostic and **MUST NOT** import from `infra`, `next`, or `react`.
- `app/api/infra/**` **MUST** encapsulate persistence/providers and **MUST NOT** become a place for route logic.
- `app/api/**/route.ts` **MUST** be an HTTP adapter and **MUST NOT** directly access provider clients (Prisma/Supabase admin/Stripe/Asaas), except explicit cross-cutting technical adapters.
- Shared contracts (`Output`, tenant context, idempotency, shared errors, secrets) **MUST** live in `lib/server/**`.

Allowed dependency direction:

- `route -> useCases/lib`
- `useCases -> services/lib`
- `services -> infra/lib`
- `infra -> lib`

Forbidden dependency direction:

- `services/domain -> route/ui`
- `useCases -> page/UI components`
- `route -> dense business logic`

### Backend Route Architecture (FOR NEW FEATURES)

Target flow:

`Route Handler -> UseCase -> Service -> Infra -> Provider/DB`

- Route handlers (`app/api/**/route.ts`) **MUST** handle HTTP concerns only:
  - request parsing/validation;
  - tenant resolution;
  - idempotency handling;
  - HTTP status mapping.
- Route handlers **MUST NOT** contain dense business logic.
- Use-case orchestration **MUST** live in `app/api/useCases/**`.
- Reusable business/domain logic **MUST** live in `app/api/services/**`.
- External integration/persistence logic **MUST** live in `app/api/infra/**`.
- Service responses **MUST** follow the `Output` contract from `lib/server/output.ts`.

### Frontend Feature Architecture (Critical, FOR NEW FEATURES)

Target flow:

`page -> feature/container -> feature/context -> feature/services -> lib/api client -> /api/v1/cheffia`

Expected structure for a new route under `app/**`:

```txt
<route>/
  page.tsx
  loading.tsx (when needed)
  error.tsx (when recovery path exists)
  features/
    container/
    context/
    services/
    types/
```

- `page.tsx` **MUST** be thin/compositional (layout, providers, route params wiring).
- `page.tsx` **MUST NOT** contain direct HTTP calls, heavy transforms, or dense business logic.
- `features/container` **MUST** focus on visual composition and **MUST NOT** call backend APIs directly.
- `features/context` **MUST** centralize feature state/actions and orchestrate services.
- `features/services` **MUST** encapsulate technical API integration for that feature.
- `app/api/**` **MUST** remain exclusive to backend route handlers/useCases/services/infra.
- Shared frontend HTTP wrappers **MUST** live in `lib/api/**`.
- Root `api/**` is legacy and **MUST NOT** receive new files.
- Files under `app/**/features/services/**` **MUST** use `PascalCase` with suffix `Service.ts`.
- Interfaces in `features/services` **SHOULD** follow `I*Service.ts` when applicable.
- `*.service.ts` under `features/services` **MUST NOT** be used for new code.
- A dedicated `business/**` layer **MUST NOT** be introduced for new frontend HTTP flows.
- Reusable visual components **MUST** be promoted to `components/**`.
- Reusable non-visual client helpers **SHOULD** be promoted to `lib/**` or `hooks/**`.

### Visual Components (FOR NEW FEATURES)

- This project uses `components.json` and `shadcn/ui`; new visual components **MUST** follow a `shadcn-first` workflow.
- Agents **MUST** prefer existing `components/ui/**` components and compose them before creating custom markup.
- When adding components via CLI, agents **MUST** use Bun commands (for example `bunx --bun shadcn@latest add <component>`).
- A fully custom visual component **MUST NOT** be created if an equivalent `shadcn/ui` component exists.
- If no viable `shadcn/ui` equivalent exists, a new component may be built, but it **MUST**:
  - use shadcn primitives/patterns/tokens;
  - follow shadcn-style accessibility and composition patterns;
  - include explicit technical justification in the PR.

- Transient user feedback for success/error/info **MUST** use `sonner` (`toast`) and **MUST NOT** use custom alert/toast implementations.
- Loading placeholders for page/data fetch states **MUST** use `Skeleton` from `components/ui/skeleton` and **MUST NOT** use custom pulse/spinner placeholders for those states.

## Design System and Theme Policy (Critical, FOR NEW FEATURES)

- Canonical global style source **MUST** be `app/globals.css`.
- `styles/globals.css` **MUST NOT** become a second source of truth for tokens.
- New UI code **MUST** use semantic design tokens (`bg-*`, `text-*`, `border-*`) mapped in globals and **MUST NOT** hardcode HEX values directly in components.
- Brand typography **MUST** use official families (`Clash Display` and `Inter Tight`) through project utilities/tokens (`font-clash`, `font-inter`, `ty-*` utilities).
- Theme mode **MUST** default to dark and **MUST** support light toggle through the shared theme provider.
- Theme persistence **MUST** use `sessionStorage` key `cheffia:theme` and **MUST** avoid flicker by applying theme class before hydration.
## API Routing Policy

- Product APIs **FOR NEW FEATURES** **MUST** use `/api/v1/cheffia/...`.
- Backoffice infrastructure endpoints may use `/api/backoffice/...`.
- Auth endpoints may remain in `/api/v1/auth/...` and `/auth/...` based on existing flows.

## Tenant Isolation Policy (Critical)

- Multi-tenant backend operations **MUST** resolve tenant via `requireTenantContext`.
- Accepted tenant sources:
  - `x-tenant-id` header;
  - `tenantId` in route/query;
  - JWT claims (`tenant_id`, `tenantId`, `https://cheffia.com/tenant_id`, `app_metadata.tenant_id`);
  - fallback resolver using `restaurantId`.
- Conflicting tenant signals **MUST** fail with `TENANT_CONTEXT_CONFLICT`.
- Missing tenant context **MUST** fail with `TENANT_CONTEXT_MISSING`, except explicit bootstrap flows.
- Sensitive read/write queries **MUST** preserve tenant filters.

## Idempotency Policy (Critical)

- Mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) **SHOULD** support `idempotency-key`.
- When idempotency is implemented, code **MUST** use:
  - `executeWithIdempotency` (`lib/server/idempotency`);
  - `SupabaseIdempotencyRepository`.
- Expected uniqueness key:
  - `tenant_id + method + endpoint + idempotency_key`.
- Same key with different payload **MUST** fail with conflict semantics.
- In-flight duplicate key **MUST** prevent re-entry.

## Webhook Policy (Asaas)

- Main webhook endpoint: `POST /api/v1/cheffia/OrderHub/webhook/asaas`.
- Security validation **MUST** validate `asaas-access-token` against `ASAAS_WEBHOOK_TOKEN` (except explicit local unsigned mode).
- If configured, `ASAAS_WEBHOOK_ALLOWED_IPS` **MUST** be enforced.
- Webhook deduplication **MUST** be tenant-scoped and provider-event scoped.
- Raw payload + headers **MUST** be persisted for traceability and safe replay handling.

## Legacy Compatibility Policy

To preserve .NET migration compatibility:

- Endpoints currently accepting legacy and canonical formats **MUST** preserve both unless explicitly refactored.
- `Menu/get` **MUST** remain compatible with `GET` and `POST` while legacy frontend paths still exist.
- `Menu/items/delete` compatibility for query-param and route-param variants **MUST** be preserved where both are currently supported.
- Existing support for `PascalCase` and `camelCase` payloads **SHOULD** be maintained where implemented.
- `GET /OrderHub/connection/{restaurantId}` legacy websocket endpoint **MUST NOT** be reintroduced for Vercel Functions.

## Output Contract Policy

- New backend services **MUST** return `Output<T>` (`okOutput` / `failOutput`).
- Route handlers consuming Output **SHOULD** map:
  - `output.isValid === true` -> success status;
  - `output.isValid === false` -> client error status;
  - unexpected exception -> `500` using `fromThrowable`.

Contract shape:

```ts
interface Output<T> {
  isValid: boolean;
  successMessages: string[];
  errorMessages: string[];
  result: T | null;
}
```

## OpenAPI and API Artifact Policy

- If backend contract changes, agents **MUST** regenerate artifacts:

```bash
bun run openapi:generate
```

- Generated artifacts that **MUST** stay in sync:
  - `app/api/openapi/openapi.json`
  - `postman/cheffia-v1.postman_collection.json`
  - `postman/cheffia-v1.environment.json`
  - `insomnia/cheffia-v1.openapi.json`

- Required validation:

```bash
bun run artifacts:check
```

## Project Rules

### MUST NOT

- Commit secrets to source files or docs.
- Remove tenant isolation from v1 endpoints.
- Remove idempotency protections from endpoints that already enforce them without explicit, justified refactor scope.
- Hardcode app URLs when environment configuration should be used.

### MUST

- Use strict TypeScript typing for new implementation code.
- Follow existing architectural patterns before introducing new structural variants.
- Keep behavior stable in legacy paths unless the task explicitly includes a behavior change.

### SHOULD

- Keep route handlers thin.
- Use stable, searchable log event names.
- Prefer existing naming conventions and module boundaries.

## Request and Interaction Safety (FOR NEW FEATURES)

### useEffect Request Discipline

- Data-fetch effects **MUST** be resilient to duplicate execution (including React Strict Mode).
- Effects that call backend APIs **SHOULD** use stable request keys and in-flight guards.
- Effects **MUST NOT** depend on unstable identities that recreate requests every render.

### Action Button Request Lock

- Any mutation-triggering button **MUST** lock on first click until request completion.
- The lock **MUST** set loading state, disable re-entry, and release in `finally`.

## LEGACY EXCEPTIONS

Legacy deviations are allowed only if explicitly listed in `.governance/ai-governance.config.json`.
Monitoring-only exclusions for `bun run governance:warn-allowlist` **MUST** be configured in `.governance/allowlist-monitoring.config.json` and **MUST NOT** change blocking behavior.

Current tracked exception categories:

1. `directInfraInV1RouteAllowlist`
2. `frontendFeatureStructureAllowlist`
3. `nonTypeScriptFileAllowlist`

When refactoring removes an exception, the allowlist **MUST** be updated in the same PR.

## Automated Enforcement

This repository enforces these rules through scripts and CI.

- Governance check command:

```bash
bun run governance:check
```

- Adapter sync command:

```bash
bun run governance:sync
```

- Legacy allowlist warning command (non-blocking):

```bash
bun run governance:warn-allowlist
```

Validation includes:

1. Canonical metadata and required keywords.
2. Adapter file sync with `agents.md`.
3. Direct infra/provider usage in `app/api/v1/**/route.ts` (blocked except explicit allowlist).
4. Frontend feature structure checks for `app/**` pages (blocked except explicit allowlist).
5. Non-TypeScript files in repository (blocked unless explicit legacy allowlist).

CI **MUST** fail when governance checks fail.

## Pull Request Checklist (MUST)

Every PR **MUST** confirm:

- [ ] Followed `agents.md`?
- [ ] Respected Clean Architecture boundaries?
- [ ] For new frontend features, followed `page/loading/error/features` structure?
- [ ] For new UI components, used `shadcn/ui` (add/compose) or justified exception?
- [ ] Ran `bun run lint` and `bun run typecheck`?
- [ ] Ran `bun run test:migration`?
- [ ] If branch/scope requires strict mode, ran `bun run test:migration:strict`?
- [ ] If backend contract changed, ran `bun run openapi:generate` and `bun run artifacts:check`?
- [ ] Reviewed tenant isolation and idempotency/replay behavior?

## Environment Essentials

Critical environment variables include:

- `DATABASE_URL`, `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_PROJECT_ID`
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`
- `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`
- `ASAAS_API_KEY`, `ASAAS_BASE_URL`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_WEBHOOK_ALLOWED_IPS`, `ASAAS_SUBACCOUNT_API_KEY_ENCRYPTION_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM`

Optional migration E2E variables:

- `MIGRATION_E2E_BASE_URL`
- `MIGRATION_E2E_TENANT_ID`
- `MIGRATION_E2E_FOREIGN_SUPABASE_ID`
- `MIGRATION_E2E_ASAAS_WEBHOOK_TOKEN`
- `MIGRATION_E2E_REQUIRED`

## References

- Tenant context: `lib/server/tenant/context.ts`
- Idempotency: `lib/server/idempotency/executeWithIdempotency.ts`
- Output contract: `lib/server/output.ts`
- Asaas webhook route: `app/api/v1/cheffia/OrderHub/webhook/asaas/route.ts`
- OpenAPI docs: `app/api/openapi/README.md`
- Migration tests: `tests/migration/README.md`



