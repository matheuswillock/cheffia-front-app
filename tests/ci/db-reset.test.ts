import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { expect, test } from "bun:test"

const resetScript = readFileSync(
  fileURLToPath(new URL("../../scripts/db-reset.mjs", import.meta.url)),
  "utf8",
)

test("local reset bootstraps Supabase before Prisma runs", () => {
  expect(resetScript).toContain('"--workdir", bootstrapWorkdir')
  expect(resetScript).toContain("00000000000000_prisma_baseline.sql")
  expect(resetScript).not.toContain('"--version", "00000000000000"')
})
