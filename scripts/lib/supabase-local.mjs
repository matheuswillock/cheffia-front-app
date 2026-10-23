import { spawnSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { measureCiStage } from "./ci-timing.mjs"

// Services that the database-backed suites never use. Realtime, Auth, the API
// gateway and PostgREST stay up because Broadcast authorization depends on them.
export const EXCLUDED_LOCAL_SERVICES = [
  "edge-runtime",
  "imgproxy",
  "logflare",
  "mailpit",
  "postgres-meta",
  "storage-api",
  "studio",
  "supavisor",
  "vector",
]

const REQUIRED_STATUS_KEYS = ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY", "JWT_SECRET"]

export function rewriteSupabaseConfig(text, { projectId, apiPort, databasePort, shadowPort }) {
  return text
    .replace('project_id = "cheffia-front-app"', `project_id = "${projectId}"`)
    .replace("port = 54321", `port = ${apiPort}`)
    .replace("port = 54322", `port = ${databasePort}`)
    .replace("shadow_port = 54320", `shadow_port = ${shadowPort}`)
}

export function localDatabaseUrl(databasePort) {
  return `postgresql://postgres:postgres@127.0.0.1:${databasePort}/postgres`
}

// Keys only: the values are secrets and must never be logged.
export function createSupabaseTestEnvironment(status, { databaseUrl }) {
  for (const key of REQUIRED_STATUS_KEYS) {
    if (typeof status[key] !== "string" || status[key].length === 0) {
      throw new Error(`supabase status is missing ${key}`)
    }
  }
  return {
    API_URL: status.API_URL,
    ANON_KEY: status.ANON_KEY,
    SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    JWT_SECRET: status.JWT_SECRET,
    DB_URL: databaseUrl,
    LOCAL_DATABASE_URL: databaseUrl,
  }
}

export function assertLocalSupabasePrerequisites(findCommand = Bun.which) {
  if (!findCommand("supabase")) {
    throw new Error("Local Supabase requires the supabase CLI and a reachable container runtime.")
  }
}

export function runCommand(command, args, { cwd, env = process.env } = {}) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${result.status ?? 1}`)
  }
}

function readStatus(workdir, repositoryRoot) {
  const result = spawnSync("supabase", ["status", "--workdir", workdir, "-o", "json"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  })
  if (result.status !== 0) {
    throw new Error(`supabase status exited with ${result.status ?? 1}`)
  }
  return JSON.parse(result.stdout)
}

// Starts an isolated local stack with the repository migrations, runs `use`,
// then always stops the containers and removes the temporary workdir.
export async function withLocalSupabase(
  { repositoryRoot, prefix, projectId, ports, excludedServices = EXCLUDED_LOCAL_SERVICES },
  use,
) {
  assertLocalSupabasePrerequisites()
  const workdir = mkdtempSync(path.join(process.env.RUNNER_TEMP ?? os.tmpdir(), prefix))
  const supabaseWorkdir = path.join(workdir, "supabase")
  const migrationsDirectory = path.join(supabaseWorkdir, "migrations")
  const databaseUrl = localDatabaseUrl(ports.database)
  let started = false

  try {
    mkdirSync(migrationsDirectory, { recursive: true })
    const configText = readFileSync(path.join(repositoryRoot, "supabase/config.toml"), "utf8")
    writeFileSync(
      path.join(supabaseWorkdir, "config.toml"),
      rewriteSupabaseConfig(configText, {
        projectId,
        apiPort: ports.api,
        databasePort: ports.database,
        shadowPort: ports.shadow,
      }),
    )
    // Baseline first: the stack is reset with the Prisma baseline, then every migration is pushed.
    cpSync(
      path.join(repositoryRoot, "supabase/migrations/00000000000000_prisma_baseline.sql"),
      path.join(migrationsDirectory, "00000000000000_prisma_baseline.sql"),
    )

    started = true
    await measureCiStage("supabase start", () =>
      runCommand("supabase", [
        "start",
        "--workdir",
        workdir,
        ...excludedServices.flatMap((service) => ["--exclude", service]),
        "--yes",
      ], { cwd: repositoryRoot }),
    )
    await measureCiStage("supabase db reset", () =>
      runCommand("supabase", ["db", "reset", "--local", "--workdir", workdir, "--no-seed", "--yes"], {
        cwd: repositoryRoot,
      }),
    )
    cpSync(path.join(repositoryRoot, "supabase/migrations"), migrationsDirectory, { recursive: true })
    await measureCiStage("supabase db push", () =>
      runCommand("supabase", ["db", "push", "--local", "--workdir", workdir, "--yes"], {
        cwd: repositoryRoot,
      }),
    )

    const status = await measureCiStage("supabase status", () =>
      readStatus(workdir, repositoryRoot),
    )
    return await measureCiStage("test callback", () => use({ status, databaseUrl, workdir }))
  } finally {
    if (started) {
      await measureCiStage("supabase stop", () => {
        const stopped = spawnSync("supabase", ["stop", "--workdir", workdir, "--no-backup"], {
          cwd: repositoryRoot,
          env: process.env,
          stdio: "inherit",
        })
        if (stopped.status !== 0) {
          console.warn("Supabase cleanup returned a non-zero status; test results are preserved.")
        }
      })
    }
    rmSync(workdir, { recursive: true, force: true })
  }
}
