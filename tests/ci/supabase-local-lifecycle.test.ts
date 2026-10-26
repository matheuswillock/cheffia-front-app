import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  assertLocalSupabasePrerequisites,
  localDatabaseUrl,
  runCommand,
  withLocalSupabase,
} from "../../scripts/lib/supabase-local.mjs"

// Only the supabase CLI is replaced: a fake executable on PATH records its arguments and answers
// `status`. Config rewriting, file copying, command ordering and cleanup run for real.
const STATUS = {
  API_URL: "http://127.0.0.1:55731",
  ANON_KEY: "anon",
  SERVICE_ROLE_KEY: "service",
  JWT_SECRET: "secret",
}

let sandbox: string
let calls: string
let originalPath: string | undefined
let originalRunnerTemp: string | undefined
let originalStepSummary: string | undefined

function installFakeSupabase(behavior: { failOn?: string; statusExit?: number; stopExit?: number } = {}) {
  const binDirectory = path.join(sandbox, "bin")
  mkdirSync(binDirectory, { recursive: true })
  const script = `#!/bin/sh
echo "$@" >> "${calls}"
case "$1" in
  ${behavior.failOn ?? "__none__"}) exit 7 ;;
  status) [ ${behavior.statusExit ?? 0} -ne 0 ] && exit ${behavior.statusExit ?? 0}; echo '${JSON.stringify(STATUS)}' ;;
  stop) exit ${behavior.stopExit ?? 0} ;;
esac
exit 0
`
  const executable = path.join(binDirectory, "supabase")
  writeFileSync(executable, script)
  chmodSync(executable, 0o755)
  process.env.PATH = `${binDirectory}:${originalPath}`
}

function createRepository() {
  const root = path.join(sandbox, "repo")
  mkdirSync(path.join(root, "supabase/migrations"), { recursive: true })
  writeFileSync(
    path.join(root, "supabase/config.toml"),
    'project_id = "cheffia-front-app"\n[api]\nport = 54321\n[db]\nport = 54322\nshadow_port = 54320\n',
  )
  writeFileSync(path.join(root, "supabase/migrations/00000000000000_prisma_baseline.sql"), "-- baseline")
  writeFileSync(path.join(root, "supabase/migrations/20260101000000_example.sql"), "-- example")
  return root
}

const options = (root: string) => ({
  repositoryRoot: root,
  prefix: "lifecycle-test-",
  projectId: "lifecycle-test",
  ports: { api: 55731, database: 55732, shadow: 55730 },
})

function recordedCommands() {
  return readFileSync(calls, "utf8").trim().split("\n")
}

beforeEach(() => {
  sandbox = mkdtempSync(path.join(os.tmpdir(), "cheffia-supabase-lifecycle-"))
  calls = path.join(sandbox, "calls.log")
  writeFileSync(calls, "")
  originalPath = process.env.PATH
  originalRunnerTemp = process.env.RUNNER_TEMP
  originalStepSummary = process.env.GITHUB_STEP_SUMMARY
  process.env.RUNNER_TEMP = sandbox
})

afterEach(() => {
  process.env.PATH = originalPath
  if (originalRunnerTemp === undefined) delete process.env.RUNNER_TEMP
  else process.env.RUNNER_TEMP = originalRunnerTemp
  if (originalStepSummary === undefined) delete process.env.GITHUB_STEP_SUMMARY
  else process.env.GITHUB_STEP_SUMMARY = originalStepSummary
  rmSync(sandbox, { recursive: true, force: true })
})

describe("local Supabase helpers", () => {
  test("builds the local database URL from the isolated port", () => {
    expect(localDatabaseUrl(55732)).toBe("postgresql://postgres:postgres@127.0.0.1:55732/postgres")
  })

  test("refuses to run without the supabase CLI", () => {
    expect(() => assertLocalSupabasePrerequisites(() => null)).toThrow(/supabase CLI/)
    expect(() => assertLocalSupabasePrerequisites(() => "/usr/bin/supabase")).not.toThrow()
  })

  test("runCommand passes quietly on success and reports the exit status on failure", () => {
    expect(() => runCommand("true", [])).not.toThrow()
    expect(() => runCommand("sh", ["-c", "exit 3"])).toThrow("sh -c exit 3 exited with 3")
  })
})

describe("withLocalSupabase", () => {
  test("starts, resets, pushes, hands the status to the callback, then stops and removes the workdir", async () => {
    installFakeSupabase()
    const root = createRepository()
    let seen: { status: typeof STATUS; databaseUrl: string; workdir: string } | undefined

    const result = await withLocalSupabase(options(root), async (context: typeof seen) => {
      seen = context
      expect(existsSync(path.join(context!.workdir, "supabase/config.toml"))).toBe(true)
      const config = readFileSync(path.join(context!.workdir, "supabase/config.toml"), "utf8")
      expect(config).toContain('project_id = "lifecycle-test"')
      expect(config).toContain("port = 55731")
      expect(existsSync(path.join(context!.workdir, "supabase/migrations/20260101000000_example.sql"))).toBe(true)
      return "callback-result"
    })

    expect(result).toBe("callback-result")
    expect(seen!.status).toEqual(STATUS)
    expect(seen!.databaseUrl).toBe(localDatabaseUrl(55732))
    expect(existsSync(seen!.workdir)).toBe(false)

    const commands = recordedCommands().map((line) => line.split(" ").slice(0, 2).join(" "))
    expect(commands).toEqual(["start --workdir", "db reset", "db push", "status --workdir", "stop --workdir"])
    expect(recordedCommands()[0]).toContain("--exclude studio")
  })

  test("writes stage durations to the GitHub step summary without exposing Supabase keys", async () => {
    installFakeSupabase()
    const summary = path.join(sandbox, "step-summary.md")
    writeFileSync(summary, "")
    process.env.GITHUB_STEP_SUMMARY = summary

    await withLocalSupabase(options(createRepository()), async () => "tests passed")

    const contents = readFileSync(summary, "utf8")
    for (const stage of [
      "supabase start",
      "supabase db reset",
      "supabase db push",
      "supabase status",
      "test callback",
      "supabase stop",
    ]) {
      expect(contents).toContain(stage)
    }
    expect(contents).toMatch(/\| supabase start \| \d+ ms \|/)
    expect(contents).not.toContain(STATUS.SERVICE_ROLE_KEY)
    expect(contents).not.toContain(STATUS.JWT_SECRET)
  })

  test("still stops the stack and removes the workdir when the callback throws", async () => {
    installFakeSupabase()
    let workdir = ""

    await expect(
      withLocalSupabase(options(createRepository()), async (context: { workdir: string }) => {
        workdir = context.workdir
        throw new Error("suite failed")
      }),
    ).rejects.toThrow("suite failed")

    expect(existsSync(workdir)).toBe(false)
    expect(recordedCommands().at(-1)).toContain("stop --workdir")
  })

  test("stops the stack when a start step fails and surfaces that failure", async () => {
    installFakeSupabase({ failOn: "db" })

    await expect(withLocalSupabase(options(createRepository()), async () => "never")).rejects.toThrow(
      /supabase db reset .* exited with 7/,
    )

    expect(recordedCommands().at(-1)).toContain("stop --workdir")
  })

  test("fails clearly when supabase status cannot be read", async () => {
    installFakeSupabase({ statusExit: 5 })

    await expect(withLocalSupabase(options(createRepository()), async () => "never")).rejects.toThrow(
      "supabase status exited with 5",
    )
  })

  test("keeps the test result when the cleanup stop returns non-zero", async () => {
    installFakeSupabase({ stopExit: 1 })

    await expect(withLocalSupabase(options(createRepository()), async () => "kept")).resolves.toBe("kept")
  })

  test("does not stop anything when it never started", async () => {
    installFakeSupabase()
    const root = createRepository()
    rmSync(path.join(root, "supabase/config.toml"))

    await expect(withLocalSupabase(options(root), async () => "never")).rejects.toThrow()

    expect(readFileSync(calls, "utf8")).toBe("")
  })
})
