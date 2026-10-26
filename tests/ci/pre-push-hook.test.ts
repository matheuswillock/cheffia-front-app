import { expect, test } from "bun:test"

test("pre-push hook runs local quality gates before optional integration gates", async () => {
  const hook = await Bun.file(new URL("../../.githooks/pre-push", import.meta.url)).text()

  expect(hook).toContain("bun run prisma:validate")
  expect(hook).toContain("bun run typecheck")
  expect(hook).toContain("bun run lint")
  expect(hook).toContain("bun run test")
  expect(hook).toContain("bun run test:components")
  expect(hook).toContain("bun run test:backend:coverage")
  expect(hook).toContain("bun run test:frontend:coverage")
  expect(hook).toContain("bun scripts/coverage-gate.mjs")
  expect(hook).toContain("CHEFFIA_PRE_PUSH_FULL")
  expect(hook).toContain("bun run test:integration:local")
  expect(hook).toContain("bun run test:realtime:local")
  expect(hook).toContain("bun run test:e2e:coverage:local")
})
