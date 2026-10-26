import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import { expect, test } from "bun:test"

const resetScript = readFileSync(
  fileURLToPath(new URL("../../scripts/db-reset.mjs", import.meta.url)),
  "utf8",
)
const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url))
const verifyScript = readFileSync(
  fileURLToPath(new URL("../../scripts/verify-foundation.mjs", import.meta.url)),
  "utf8",
)

test("ordering verification covers every new table and tenant isolation", () => {
  for (const table of [
    "restaurant_tables",
    "table_sessions",
    "menu_categories",
    "menu_items",
    "modifier_groups",
    "modifiers",
    "menu_item_modifier_groups",
    "orders",
    "order_items",
    "order_item_modifiers",
    "order_state_transitions",
  ]) {
    expect(verifyScript).toContain(`"${table}"`)
  }

  expect(verifyScript).toContain("ordering tables are incomplete")
  expect(verifyScript).toContain("ordering RLS isolation failed")
  expect(verifyScript).toContain("orders_select_staff")
  expect(verifyScript).toContain("atomic order/outbox")
  expect(verifyScript).toContain("failed transaction left ordering rows behind")
})

test("local reset bootstraps the complete Supabase migration history", () => {
  expect(resetScript).toContain('["start", "--workdir", bootstrapWorkdir')
  expect(resetScript).toContain("00000000000000_prisma_baseline.sql")
  expect(resetScript).not.toContain('"--version", "00000000000000"')
  expect(resetScript).toContain("process.env.DATABASE_URL = LOCAL_DATABASE_URL")
  expect(resetScript).toContain("process.env.DIRECT_URL = LOCAL_DATABASE_URL")
  expect(resetScript).toContain('"db", "push"')
  expect(resetScript).not.toContain("prisma:migrate:deploy")
})

test("local reset reports boot, reset, and migration-push durations to the step summary", () => {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), "cheffia-db-reset-timing-"))
  const bin = path.join(sandbox, "bin")
  const summary = path.join(sandbox, "summary.md")
  const calls = path.join(sandbox, "supabase-calls.log")
  mkdirSync(bin, { recursive: true })
  writeFileSync(calls, "")
  const fakeCli = path.join(bin, "supabase")
  writeFileSync(fakeCli, `#!/bin/sh\necho "$@" >> "${calls}"\n`)
  chmodSync(fakeCli, 0o755)

  try {
    const result = spawnSync("bun", ["scripts/db-reset.mjs"], {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        RUNNER_TEMP: sandbox,
        GITHUB_STEP_SUMMARY: summary,
      },
      encoding: "utf8",
    })

    expect(result.status).toBe(0)
    const summaryText = readFileSync(summary, "utf8")
    expect(summaryText).toMatch(/\| supabase start \| \d+ ms \|/)
    expect(summaryText).toMatch(/\| supabase db reset \| \d+ ms \|/)
    expect(summaryText).toMatch(/\| supabase db push \| \d+ ms \|/)
    expect(readFileSync(calls, "utf8")).toContain("db push")
  } finally {
    rmSync(sandbox, { recursive: true, force: true })
  }
})

test("CI starts only the Supabase database container", () => {
  expect(resetScript).toContain('"--exclude"')
  expect(resetScript).toContain("flatMap")
  expect(resetScript).toContain('"--workdir", bootstrapWorkdir')
  expect(resetScript).toContain("postgrest")
  expect(resetScript).toContain("storage-api")
  expect(resetScript).toContain("studio")
})

test("foundation verification uses the local database explicitly", () => {
  expect(verifyScript).toContain("process.env.DATABASE_URL = LOCAL_DATABASE_URL")
  expect(verifyScript).toContain("supabase_migrations.schema_migrations")
  expect(verifyScript).not.toContain("_prisma_migrations")
})
