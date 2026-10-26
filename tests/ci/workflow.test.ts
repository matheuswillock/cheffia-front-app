import { expect, test } from "bun:test"

const workflow = await Bun.file(
  new URL("../../.github/workflows/pipeline.yml", import.meta.url),
).text()
const packageJson = await Bun.file(new URL("../../package.json", import.meta.url)).json()

test("CI executes the repository test suite", () => {
  expect(workflow).toContain("name: Tests")
  expect(workflow).toContain("run: bun run test\n")
})

test("development server uses the Prisma-compatible bundler and avoids fixed inspector ports", () => {
  expect(packageJson.scripts.dev).toContain("next dev")
  expect(packageJson.scripts.dev).not.toContain("--turbopack")
  expect(packageJson.scripts.dev).not.toContain("NODE_OPTIONS")
})

test("CI enforces a 90 percent backend, frontend and E2E coverage gate", () => {
  expect(workflow).toContain("bun run test:backend:coverage")
  expect(workflow).toContain("bun run test:frontend:coverage")
  expect(workflow).toContain("bun run test:e2e:coverage:local")
  expect(workflow).toContain("bun scripts/coverage-gate.mjs")
  expect(workflow).toContain("Enforce 90 percent backend and frontend coverage")
  expect(workflow).toContain("Enforce 90 percent E2E coverage")
})

test("CI creates the next promotion pull request", () => {
  expect(workflow).toContain("pull-requests: write")
  expect(workflow).toContain("promote-feature-to-develop:")
  expect(workflow).toContain("promote-develop-to-release:")
  expect(workflow).toContain("promote-release-to-main:")
  expect(workflow).toContain("bun scripts/ci/open-promotion-pr.mjs")
  expect(workflow).not.toContain("production-migrations:")
  expect(workflow).toContain('branches: ["develop", "release", "main"]')
  expect(workflow).toContain("release:develop")
  expect(workflow).toContain("main:release")
})

test("automatic promotion PRs do not repeat expensive quality jobs", () => {
  expect(workflow).toContain("github.event.pull_request.user.login != 'github-actions[bot]'")
  expect(workflow).toContain("github.event_name == 'push'")
  expect(workflow).toContain("needs: [quality, database, realtime]")
})

test("realtime authorization runs as its own job in parallel with the database job and gates promotion", async () => {
  const realtimeStart = workflow.indexOf("  realtime:\n")
  expect(realtimeStart).toBeGreaterThan(-1)
  expect(workflow).toContain("name: Realtime integration")
  const realtimeEnd = workflow.indexOf("\n  promote-feature-to-develop:", realtimeStart)
  const realtimeJob = workflow.slice(realtimeStart, realtimeEnd)
  // Parallel with database: it depends only on branch policy, never on the database job.
  expect(realtimeJob).toContain("needs: branch-policy")
  expect(realtimeJob).toContain("bun run prisma:generate")
  expect(realtimeJob).toContain("bun run test:realtime:local")
  expect(realtimeJob).toContain("supabase/setup-cli@v1")
  expect(realtimeJob).toContain('version: "2.122.0"')
  expect(realtimeJob).toContain("./.github/actions/setup-bun-deps")
  const bunSetup = await Bun.file(new URL("../../.github/actions/setup-bun-deps/action.yml", import.meta.url)).text()
  expect(bunSetup).toContain("bun install --frozen-lockfile")
  expect(realtimeJob).not.toContain("db:reset")
  // Every promotion job that waits for the database must also wait for realtime.
  const promotions = workflow.slice(workflow.indexOf("  promote-feature-to-develop:"))
  expect(promotions.match(/needs: \[quality, database, realtime\]/g)?.length).toBe(3)
  const database = workflow.slice(workflow.indexOf("  database:\n"), realtimeStart)
  expect(database).not.toContain("test:realtime:local")
})

test("package scripts expose the realtime runner and keep it out of the database integration run", () => {
  expect(packageJson.scripts["test:realtime:local"]).toBe("bun scripts/integration-local.mjs --realtime")
  expect(packageJson.scripts["test:integration:local"]).toContain("--path-ignore-patterns")
  expect(packageJson.scripts["test:integration:local"]).toContain("realtime-*.test.ts")
})

test("Supabase GitHub integration owns production migrations", async () => {
  expect(workflow).not.toContain("production-migrations:")
  expect(await Bun.file(new URL("../../.github/workflows/production-migrations.yml", import.meta.url)).exists()).toBe(false)
  expect(workflow).toContain("Supabase GitHub Integration")
})

test("integration tests run against the local database after it is verified", () => {
  expect(packageJson.scripts["test:integration:local"]).toBe(
    'bun test tests/integration tests/regressions --path-ignore-patterns "**/realtime-*.test.ts"',
  )
  // Unit gates and coverage must not need a database.
  expect(packageJson.scripts.test).not.toContain("tests/integration")
  expect(packageJson.scripts["test:backend:coverage"]).not.toContain("tests/integration")

  const database = workflow.slice(workflow.indexOf("name: Local database and RLS"))
  expect(database.indexOf("bun run db:verify")).toBeGreaterThan(-1)
  expect(database.indexOf("bun run test:integration:local")).toBeGreaterThan(database.indexOf("bun run db:verify"))
  // The database job does not run typecheck, so it must generate the Prisma client itself.
  expect(database).toContain("bun run prisma:generate")
  expect(database.indexOf("bun run prisma:generate")).toBeLessThan(database.indexOf("bun run test:integration:local"))
})

test("CI writes local database integration test duration to the step summary", () => {
  expect(workflow).toContain(
    'bun scripts/ci/timed-command.mjs --label "repository and SQL integration tests" -- bun run test:integration:local',
  )
})

test("CI publishes static and E2E diagnostics when quality gates fail", () => {
  expect(workflow).toContain("name: Publish static quality diagnostics")
  expect(workflow).toContain("name: Upload static quality diagnostics")
  expect(workflow).toContain("diagnostics/coverage-gate.log")
  expect(workflow).toContain("name: Publish E2E diagnostics")
  expect(workflow).toContain("diagnostics/e2e.log")
  expect(workflow).toContain("tail -200 diagnostics/e2e.log")
  expect(workflow).toContain("if: always()")
})

test("CI runs E2E once with both readable and JSON reporters", async () => {
  expect(workflow).not.toContain("run: bun run test:e2e:local\n")
  expect(workflow).toContain("bun run test:e2e:coverage:local")
  const config = await Bun.file(new URL("../../playwright.config.ts", import.meta.url)).text()
  expect(config).toContain('reporters.push(["json", { outputFile: process.env.PLAYWRIGHT_JSON_REPORT }])')
  expect(config).toContain('reporters.push(process.env.CI ? ["github"] : ["list"])')
  expect(config).toContain('reporters.push(["html", { outputFolder: "playwright-report", open: "never" }])')
})

test("CI preserves check identities while splitting and aggregating quality jobs", () => {
  expect(workflow).toContain("name: Validate branch flow")
  expect(workflow).toContain("name: Quality gates")
  expect(workflow).toContain("name: Local database and RLS")
  expect(workflow).toContain("name: Realtime integration")
  expect(workflow).toContain("  quality-static:")
  expect(workflow).toContain("  quality-e2e:")
  expect(workflow).toContain("needs: [branch-policy, quality-static, quality-e2e]")
  expect(workflow).toContain("bun scripts/ci/quality-gate.mjs --classify-job")
  expect(workflow).toContain("bun scripts/ci/quality-gate.mjs --aggregate")
  expect(workflow.match(/needs: \[quality, database, realtime\]/g)?.length).toBe(3)
})

test("CI caches dependencies and browser/build assets and uploads failure diagnostics", () => {
  expect(workflow).toContain("./.github/actions/setup-bun-deps")
  expect(workflow).toContain("actions/cache@v5")
  expect(workflow).toContain("actions/upload-artifact@v4")
  expect(workflow).toContain("playwright-report/")
  expect(workflow).toContain("test-results/")
  expect(workflow).toContain("if: ${{ !cancelled() }}")
})

test("every CI job has a bounded timeout and only work branches can cancel each other", () => {
  expect(workflow).not.toContain("ubuntu-latest")
  expect(workflow).toContain("ubuntu-24.04")
  expect(workflow).toContain("timeout-minutes:")
  expect(workflow).toContain("startsWith(github.ref, 'refs/heads/feature/')")
  expect(workflow).toContain("startsWith(github.ref, 'refs/heads/bugfix/')")
  expect(workflow).not.toContain("cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}")
  expect(workflow.match(/timeout-minutes:/g)?.length).toBe(workflow.match(/^  [a-z-]+:$/gm)?.length)
})

test("promotion jobs share the tested promotion script and keep their stable job keys", () => {
  expect(workflow.match(/bun scripts\/ci\/open-promotion-pr\.mjs/g)?.length).toBe(3)
  expect(workflow).not.toContain("gh pr create")
  expect(workflow).toContain("promote-feature-to-develop:")
  expect(workflow).toContain("promote-develop-to-release:")
  expect(workflow).toContain("promote-release-to-main:")
})
