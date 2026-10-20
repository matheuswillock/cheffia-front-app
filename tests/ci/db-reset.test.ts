import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { expect, test } from "bun:test"

const resetScript = readFileSync(
  fileURLToPath(new URL("../../scripts/db-reset.mjs", import.meta.url)),
  "utf8",
)
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
