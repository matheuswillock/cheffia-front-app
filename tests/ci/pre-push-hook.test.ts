import { expect, test } from "bun:test"

test("pre-push hook runs local quality gates before optional integration gates", async () => {
  const hook = await Bun.file(new URL("../../.githooks/pre-push", import.meta.url)).text()

  expect(hook).toContain('BUN_BIN="${BUN_INSTALL:-$HOME/.bun}/bin/bun"')
  expect(hook).toContain('"$BUN_BIN"')
  expect(hook).toContain("run_bun run prisma:validate")
  expect(hook).toContain("run_bun run typecheck")
  expect(hook).toContain("run_bun run lint")
  expect(hook).toContain("run_bun run test")
  expect(hook).toContain("run_bun run test:components")
  expect(hook).toContain("run_bun run test:backend:coverage")
  expect(hook).toContain("run_bun run test:frontend:coverage")
  expect(hook).toContain("run_bun scripts/coverage-gate.mjs")
  expect(hook).toContain("CHEFFIA_PRE_PUSH_FULL")
  expect(hook).toContain("run_bun run test:integration:local")
  expect(hook).toContain("run_bun run test:realtime:local")
  expect(hook).toContain("run_bun run test:e2e:coverage:local")
})
