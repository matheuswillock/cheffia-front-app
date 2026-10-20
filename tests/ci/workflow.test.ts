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
  expect(workflow).toContain('branches: ["develop", "release", "main"]')
  expect(workflow).toContain("release:develop")
  expect(workflow).toContain("main:release")
  expect(workflow).toContain("develop)")
  expect(workflow).toContain("release)")
})

test("automatic promotion PRs do not repeat expensive quality jobs", () => {
  expect(workflow).toContain("github.event.pull_request.user.login != 'github-actions[bot]'")
  expect(workflow).toContain("github.event_name == 'push'")
  expect(workflow).toContain("needs: [quality, database]")
})

test("Supabase GitHub integration owns production migrations", async () => {
  expect(workflow).not.toContain("production-migrations:")
  expect(await Bun.file(new URL("../../.github/workflows/production-migrations.yml", import.meta.url)).exists()).toBe(false)
  expect(workflow).toContain("Supabase GitHub Integration")
})
