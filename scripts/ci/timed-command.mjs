import { spawnSync } from "node:child_process"
import { measureCiStage } from "../lib/ci-timing.mjs"

const args = process.argv.slice(2)
const labelIndex = args.indexOf("--label")
const separatorIndex = args.indexOf("--")

if (labelIndex < 0 || separatorIndex < 0 || labelIndex + 1 >= separatorIndex || separatorIndex + 1 >= args.length) {
  console.error("Usage: bun scripts/ci/timed-command.mjs --label <stage> -- <command> [args...]")
  process.exit(2)
}

const label = args[labelIndex + 1]
const [command, ...commandArgs] = args.slice(separatorIndex + 1)

try {
  const status = await measureCiStage(label, () => {
    const result = spawnSync(command, commandArgs, { stdio: "inherit", env: process.env })
    if (result.error) throw result.error
    return result.status ?? 1
  })
  process.exitCode = status
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
