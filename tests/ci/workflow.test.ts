import { expect, test } from "bun:test"

const workflow = await Bun.file(
  new URL("../../.github/workflows/pipeline.yml", import.meta.url),
).text()
const productionWorkflow = await Bun.file(
  new URL("../../.github/workflows/production-migrations.yml", import.meta.url),
).text()

test("CI executes the repository test suite", () => {
  expect(workflow).toContain("name: Tests")
  expect(workflow).toContain("run: bun run test\n")
})

test("CI creates the next promotion pull request", () => {
  expect(workflow).toContain("pull-requests: write")
  expect(workflow).toContain("promote:")
  expect(workflow).toContain("gh pr create")
})

test("production migrations run only after a push to main", () => {
  expect(workflow).not.toContain("production-migrations:")
  expect(productionWorkflow).toContain('branches: ["main"]')
  expect(productionWorkflow).not.toContain("workflow_dispatch")
  expect(productionWorkflow).toContain('version: "2.109.1"')
  expect(productionWorkflow).toContain("run: bun run db:migrate:deploy")
  expect(productionWorkflow).toContain("environment: production")
  expect(productionWorkflow).toContain("DIRECT_URL: ${{ secrets.DIRECT_URL }}")
})
