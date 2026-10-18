import { expect, test } from "bun:test"

const workflow = await Bun.file(
  new URL("../../.github/workflows/pipeline.yml", import.meta.url),
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
