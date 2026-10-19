import { spawnSync } from "node:child_process"

const result = spawnSync("bun", ["run", "prisma:migrate:deploy"], {
  stdio: "inherit",
  env: process.env,
})

if (result.error) throw result.error
process.exitCode = result.status ?? 1
