import { expect, test } from "bun:test"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"

const repositoryRoot = path.resolve(import.meta.dir, "../..")
const timedCommand = path.join(repositoryRoot, "scripts/ci/timed-command.mjs")

test("records the duration of a successful command in the GitHub step summary", () => {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), "cheffia-timed-command-"))
  const summary = path.join(sandbox, "summary.md")

  try {
    const result = spawnSync(
      process.execPath,
      [timedCommand, "--label", "integration tests", "--", process.execPath, "-e", "process.exit(0)"],
      { cwd: repositoryRoot, env: { ...process.env, GITHUB_STEP_SUMMARY: summary }, encoding: "utf8" },
    )

    expect(result.status).toBe(0)
    expect(readFileSync(summary, "utf8")).toMatch(/\| integration tests \| \d+ ms \|/)
  } finally {
    rmSync(sandbox, { recursive: true, force: true })
  }
})

test("records duration and propagates a failed command exit code", () => {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), "cheffia-timed-command-"))
  const summary = path.join(sandbox, "summary.md")

  try {
    const result = spawnSync(
      process.execPath,
      [timedCommand, "--label", "integration tests", "--", process.execPath, "-e", "process.exit(7)"],
      { cwd: repositoryRoot, env: { ...process.env, GITHUB_STEP_SUMMARY: summary }, encoding: "utf8" },
    )

    expect(result.status).toBe(7)
    expect(readFileSync(summary, "utf8")).toMatch(/\| integration tests \| \d+ ms \|/)
  } finally {
    rmSync(sandbox, { recursive: true, force: true })
  }
})
