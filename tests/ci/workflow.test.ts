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
  expect(workflow).toContain("bun run coverage:gate")
  expect(workflow).toContain("Enforce 90 percent coverage")
})

test("CI creates the next promotion pull request", () => {
  expect(workflow).toContain("pull-requests: write")
  expect(workflow).toContain("promote-feature-to-develop:")
  expect(workflow).toContain("promote-develop-to-release:")
  expect(workflow).toContain("promote-release-to-main:")
  expect(workflow).toContain("gh pr create")
  expect(workflow).toContain("No commits between")
  expect(workflow).toContain('branches: ["develop", "release", "main"]')
  expect(workflow).toContain("release:develop")
  expect(workflow).toContain("main:release")
  expect(workflow).toContain("develop)")
  expect(workflow).toContain("release)")
})

test("automatic promotion PRs do not repeat expensive quality jobs", () => {
  expect(workflow).toContain("github.event.pull_request.user.login != 'github-actions[bot]'")
  expect(workflow).toContain("github.event_name == 'push'")
  expect(workflow).toContain("needs: [quality, database, realtime]")
})

test("realtime authorization runs as its own job in parallel with the database job and gates promotion", () => {
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
  expect(realtimeJob).toContain('version: "2.109.1"')
  expect(realtimeJob).toContain('bun-version: "1.4.3"')
  expect(realtimeJob).toContain("bun install --frozen-lockfile")
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
