<!-- CANONICAL AI GOVERNANCE FILE: agents.md -->
# Cheffia Front App - AI Implementation Governance

**Version:** 2.2.2
**Last Updated:** 2026-03-14
**Canonical Source:** `agents.md` (single source of truth)
**Adapter Files:** generated with `bun run governance:sync`

This document defines implementation governance for AI agents in this repository. It is intentionally normative.

## Normative Keywords

- **MUST**: mandatory rule.
- **MUST NOT**: prohibited behavior.
- **SHOULD**: recommended default unless there is a justified exception.
- **LEGACY EXCEPTIONS**: allowed temporary deviations, explicitly listed in `.governance/ai-governance.config.json` (source of truth for governance checks).
- **FOR NEW FEATURES**: rules that apply to all net-new feature work.

## Source of Truth and Distribution

- Agents **MUST** treat `agents.md` as the canonical instruction file.
- Adapter files (`.github/copilot-instructions.md`, `.cursor/rules/cheffia-front-agents.mdc`, `CLAUDE.md`, `AGENTS.md`) **MUST** be generated from this file.
- Team members and agents **MUST NOT** manually edit generated adapter files.
- Whenever any AI governance/instruction file is changed, the equivalent rule update **MUST** be propagated to every generated adapter in the same change by running `bun run governance:sync`.
- An AI-governance rule change is **NOT** complete until the canonical file and every generated adapter reflect the same rule set.
- `AGENTS.md` is treated as a logical alias for `agents.md` in governance checks to prevent cross-platform case-collision issues.
- `.github/agents.md` is intentionally not generated to avoid confusion with the canonical file name.
- Regenerate adapters with:

```bash
bun run governance:sync
```

- Validate governance and architecture rules with:

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

### Backend (FOR NEW FEATURES)

Target flow:

`Route -> UseCase -> [Service] -> Infra/Provider`

- Route handlers (`app/api/**/route.ts`) **MUST** handle HTTP concerns only: request parsing/validation, tenant resolution, idempotency handling, and HTTP status mapping.
- Route handlers **MUST NOT** contain dense business logic.
- Use-case orchestration **MUST** live in `app/api/useCases/**`.
- Reusable business/domain logic **MUST** live in `app/api/services/**`.
- External integration/persistence logic **MUST** live in `app/api/infra/**`.
- Routes **MUST NOT** call Prisma directly for new code.
- New product API code **MUST** follow the canonical `app/api` layout:

```text
app/api/
  v1/
    cheffia/
      [domain]/
        route.ts
        [param]/
          route.ts
        DTO/                      # optional route-local transport contracts
  useCases/
    [domain]/
      I[Feature]UseCase.ts
      [Feature]UseCase.ts
  services/
    [Feature]/
      I[Feature]Service.ts
      [Feature]Service.ts
  infra/
    data/
      prisma.ts
      repositories/
```

- `app/api/v1/**/route.ts` **MUST** be the default location for new product APIs.
- `app/api/v1/**/DTO/` **SHOULD** contain request/response contracts only when the route needs route-local transport mapping.
- `app/api/useCases/[domain]/I*UseCase.ts` **MUST** define the use-case contract for that domain.
- `app/api/useCases/[domain]/*UseCase.ts` **MUST** implement orchestration, business validation, and Output creation.
- `app/api/services/[Feature]/I*Service.ts` **SHOULD** define the service contract when a service is introduced.
- `app/api/services/[Feature]/*Service.ts` **SHOULD** implement domain logic, third-party integration logic, or reusable technical orchestration behind a use case.
- `app/api/infra/data/prisma.ts` **MUST** remain the shared Prisma client boundary.
- `app/api/infra/data/repositories/**` **SHOULD** hold repository helpers when data access becomes reusable or complex.

### Frontend (Critical, FOR NEW FEATURES)

Target flow:

`page -> feature/container -> feature/context -> feature/services -> lib/api client -> /api/v1/cheffia`

- Every new frontend page under `app/**` **MUST** use page-local feature architecture with:
  - `page.tsx`
  - `loading.tsx`
  - `features/context`
  - `features/services`
  - `features/container`
- Every new frontend page under `app/**` **MUST** follow the canonical `features/` layout:

```text
app/[route]/
  page.tsx
  loading.tsx
  features/
    context/
      [Feature]Types.ts
      [Feature]Hook.ts
      [Feature]Context.tsx
    services/
      I[Feature]Service.ts
      [Feature]Service.ts
    container/
      [Feature]Container.tsx
    components/                   # optional
    types/                        # optional
    validation/                   # optional
    hooks/                        # optional
    utils/                        # optional
```

- `page.tsx` **MUST** be thin and compositional (assemble layout, wire provider/container, route params, start feature flow).
- `page.tsx` **MUST NOT** contain dense business logic, direct HTTP calls, large transforms, or excessive local state.
- `features/context` **MUST** contain `*Types.ts`, `*Hook.ts`, and `*Context.tsx`.
- `*Types.ts` **MUST** define context state, actions, and local contracts exposed by the feature context.
- `*Hook.ts` **MUST** contain primary feature orchestration/state logic consumed by context/provider.
- `*Context.tsx` **MUST** expose provider and public consumer hook for feature state.
- `features/services` **MUST** contain `I*Service.ts` and `*Service.ts`.
- `I*Service.ts` **MUST** define the frontend service contract.
- `*Service.ts` **MUST** implement backend communication, response mapping, and technical error handling.
- `features/container` **MUST** contain page-specific visual composition components and `*Container.tsx` as main page composition entry.
- Visual components in `features/container` **MUST NOT** call backend APIs directly or own dense business rules.
- `features/context` **MUST** centralize page state, hooks, local types/contracts, and feature orchestration.
- `features/context` **MUST** call `features/services` for remote communication and expose state/actions to containers.
- Optional `features/*` folders **MUST NOT** be created empty and **MUST NOT** replace required `context/services/container` baseline.
- Page-specific logic **MUST** stay inside the local `features/` folder.
- When code stops being page-specific and becomes reusable, it **SHOULD** be moved to an appropriate shared layer (`components/**`, `lib/**`, `hooks/**`).

### Visual Components (FOR NEW FEATURES)

- Any net-new visual component **MUST** start with the `shadcn` skill workflow documented at `https://ui.shadcn.com/docs/skills` before implementation.
- Agents **MUST** prefer existing `components/ui/**` components and compose them before introducing custom visual markup.
- When the `shadcn` workflow requires CLI commands in this repository, agents **MUST** use Bun-based commands (for example `bunx --bun shadcn@latest ...`).
- A fully custom visual component **MUST NOT** be created if an equivalent `shadcn/ui` component exists.
- If no viable `shadcn/ui` equivalent exists, a new component may be built, but it **MUST** use shadcn primitives/patterns/tokens, follow accessibility/composition patterns, and include explicit technical justification in the PR.
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
- Expected uniqueness key: `tenant_id + method + endpoint + idempotency_key`.
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

- New UseCases **MUST** return `Output<T>` (`okOutput` / `failOutput`) from `lib/server/output.ts`, unless explicitly approved as a legacy-compatible exception.
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
- Create implementation summary docs (`*_IMPLEMENTATION_SUMMARY.md`, `*_FIX_SUMMARY.md`, similar generated summaries).
- Use npm or yarn (project standard is Bun).
- Remove tenant isolation from v1 endpoints.
- Remove idempotency protections from endpoints that already enforce them without explicit, justified refactor scope.
- Hardcode app URLs when environment configuration should be used.

### MUST

- Search and align with existing patterns before introducing new structures.
- Use strict TypeScript typing for new implementation code.
- Use `console.info` for flow logs and `console.error` for errors.
- In route-level error logs (`app/api/**/route.ts`), identify routes by stable route name + HTTP method and avoid logging path templates/raw endpoint URLs.
- Services (`frontend` and `backend`) **MUST** follow interface + concrete implementation when introducing new service contracts.
- Keep behavior stable in legacy paths unless the task explicitly includes a behavior change.

### FOR NEW FEATURES

- Implementation code **MUST** be written in TypeScript.
- JavaScript and Python files **MUST NOT** be used to implement new features.
- Non-TypeScript files are allowed only via explicit `LEGACY EXCEPTIONS` in `.governance/ai-governance.config.json`.

### SHOULD

- Keep route handlers thin and use descriptive success/error messages.
- Use stable, searchable log event names.
- Prefer existing naming conventions and module boundaries.

## Request and Interaction Safety (FOR NEW FEATURES)

### useEffect Request Discipline

- Data-fetching effects **MUST** be idempotent and resistant to duplicate execution (including React Strict Mode in development).
- Effects that call backend endpoints **MUST** implement deduplication with:
  - stable request key (for example `tenantId/restaurantId/filter`);
  - in-flight guard (reuse or ignore while same request is pending);
  - last-success key guard to avoid refetching unchanged inputs.
- Effects **MUST NOT** depend on unstable function/object identities that recreate requests on every render.
- Before creating a new fetch for the same domain data, code **SHOULD** reuse data already available in existing Context providers.
- When a page requires repeated polling/realtime fallback, the interval **MUST** be explicit, documented in code, and cleared on cleanup.

### Action Button Request Lock

- Any button that triggers backend mutation (`POST`, `PUT`, `PATCH`, `DELETE`) **MUST** lock on first click.
- The lock **MUST**:
  - set loading state immediately;
  - disable the trigger while request is pending;
  - prevent re-entry/double submit until completion (`finally`).
- For critical mutations (financial or irreversible actions), implementations **SHOULD** also use idempotency keys or server-side duplicate protection.

## LEGACY EXCEPTIONS

Legacy deviations are allowed only if explicitly listed in `.governance/ai-governance.config.json`.
Monitoring-only exclusions for `bun run governance:warn-allowlist` **MUST** be configured in `.governance/allowlist-monitoring.config.json` and **MUST NOT** change check behavior.

Current tracked exception categories:

1. `prismaInV1RouteAllowlist`
2. `useCaseWithoutOutputAllowlist`
3. `frontendFeatureStructureAllowlist`
4. `nonTypeScriptFileAllowlist`

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

- Warning monitor exclusions config (non-blocking only):

```bash
.governance/allowlist-monitoring.config.json
```

Validation includes:

1. Canonical metadata and required keywords.
2. Adapter file sync with `agents.md`.
3. Direct Prisma usage in `app/api/v1/**/route.ts` (blocked except explicit allowlist).
4. Output contract presence in new UseCases (blocked except explicit allowlist).
5. Frontend feature structure checks for `app/**` pages (blocked except explicit allowlist).
6. Non-TypeScript files in repository (blocked unless explicit legacy allowlist).

CI **MUST** fail when governance checks fail.

## Pull Request Checklist (MUST)

Every PR **MUST** confirm:

- [ ] Followed `agents.md`?
- [ ] Created a legacy exception? If yes, justified it and updated allowlist?
- [ ] For new frontend features, followed `page/loading/features` architecture?
- [ ] For new UI components, used `shadcn/ui` (add/compose) or justified exception?
- [ ] Ran `bun run typecheck` and `bun run lint`?
- [ ] Ran `bun run governance:check`?
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
