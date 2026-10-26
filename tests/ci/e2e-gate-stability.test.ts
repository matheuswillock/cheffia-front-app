import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

import {
  assertLocalE2EPrerequisites,
  requireCreatedOrder,
  requireE2EEnvironment,
} from "../../scripts/e2e-preflight.mjs"

const repositoryRoot = path.resolve(import.meta.dir, "../..")

test("fails before provisioning when a local E2E prerequisite is unavailable", () => {
  expect(() =>
    assertLocalE2EPrerequisites({
      findCommand: () => "/usr/bin/available-command",
      canReachDocker: () => false,
    }),
  ).toThrow("Docker daemon")
})

test("requires every E2E value before a browser flow consumes it", () => {
  expect(() => requireE2EEnvironment({}, "E2E_STAFF_EMAIL")).toThrow(
    "Missing required E2E environment variable: E2E_STAFF_EMAIL",
  )
  expect(() => requireE2EEnvironment({ E2E_STAFF_EMAIL: "" }, "E2E_STAFF_EMAIL")).toThrow(
    "Missing required E2E environment variable: E2E_STAFF_EMAIL",
  )
  expect(() => requireE2EEnvironment({ E2E_STAFF_EMAIL: 42 }, "E2E_STAFF_EMAIL")).toThrow(
    "Missing required E2E environment variable: E2E_STAFF_EMAIL",
  )
})

test("rejects an order response that omits the server order identity", () => {
  expect(() => requireCreatedOrder({ status: "pending" })).toThrow(
    "Order creation response does not include orderId and status strings.",
  )
  expect(() => requireCreatedOrder({ orderId: "order-1", status: 200 })).toThrow(
    "Order creation response does not include orderId and status strings.",
  )
})

test("pins the jsdom version compatible with the Bun component-test runtime", () => {
  const packageJson = readFileSync(path.join(repositoryRoot, "package.json"), "utf8")

  expect(packageJson).toContain('"jsdom": "29.1.1"')
})

test("starts an isolated application server instead of reusing another worktree", () => {
  const config = readFileSync(path.join(repositoryRoot, "playwright.config.ts"), "utf8")

  expect(config).toContain('"http://127.0.0.1:3100"')
  expect(config).toContain("reuseExistingServer: false")
  expect(config).toContain("command: `bun run next dev")
})

test("checks local E2E prerequisites before allocating Supabase fixtures", () => {
  const bootstrap = readFileSync(path.join(repositoryRoot, "scripts/e2e-local.mjs"), "utf8")

  const lifecycle = readFileSync(path.join(repositoryRoot, "scripts/lib/supabase-local.mjs"), "utf8")

  // The workdir is allocated by the shared lifecycle, so the preflight must run before it is called.
  expect(bootstrap.indexOf("assertLocalE2EPrerequisites()")).toBeLessThan(
    bootstrap.indexOf("withLocalSupabase("),
  )
  expect(lifecycle).toContain("os.tmpdir()")
})

test("reports every missing local E2E prerequisite", () => {
  expect(() => assertLocalE2EPrerequisites({ findCommand: () => null })).toThrow(
    "bun, supabase, docker",
  )
})

test("accepts available local E2E prerequisites", () => {
  expect(() => assertLocalE2EPrerequisites({
    findCommand: () => "/usr/bin/available-command",
    canReachDocker: () => true,
  })).not.toThrow()
})

test("documents the local Supabase E2E prerequisites for Fedora contributors", () => {
  const runbook = readFileSync(path.join(repositoryRoot, "docs/runbooks/mvp-ordering.md"), "utf8")

  expect(runbook).toContain("bun run test:e2e:local")
  expect(runbook).toContain("Fedora")
})

test("kitchen sign-in uses an exact password-field label", () => {
  const spec = readFileSync(
    path.join(repositoryRoot, "tests/e2e/ordering-vertical-slice.spec.ts"),
    "utf8",
  )

  expect(spec).toContain('kitchen.getByLabel("Senha", { exact: true }).fill(staffPassword)')
})
