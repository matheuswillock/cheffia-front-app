import { spawnSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { measureCiStage } from "./lib/ci-timing.mjs"

function redact(output) {
  return output
    .replace(
      /("?(?:ANON_KEY|SERVICE_ROLE_KEY|SECRET_KEY|JWT_SECRET|PUBLISHABLE_KEY|S3_PROTOCOL_ACCESS_KEY_ID|S3_PROTOCOL_ACCESS_KEY_SECRET|PASSWORD|TOKEN)"?\s*:\s*"?)[^",\s}]+/gi,
      "$1<redacted>",
    )
    .replace(/(postgres(?:ql)?:\/\/)[^\s"']+/gi, "$1<redacted>")
    .replace(/(eyJ[a-zA-Z0-9._-]+|sb_(?:publishable|secret)_[a-zA-Z0-9_-]+)/g, "<redacted>")
}

async function run(command, args) {
  const stage = command === "supabase" ? `supabase ${args.slice(0, args[0] === "db" ? 2 : 1).join(" ")}` : command
  return measureCiStage(stage, () => {
    const result = spawnSync(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
      encoding: "utf8",
      env: process.env,
    })

    if (result.error) throw result.error

    if (result.status !== 0) {
      const output = redact(`${result.stdout ?? ""}\n${result.stderr ?? ""}`).trim()
      const error = new Error(output || `${command} exited with status ${result.status ?? 1}`)
      error.exitCode = result.status ?? 1
      throw error
    }
  })
}

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const supabaseRoot = path.join(repositoryRoot, "supabase")
const SUPABASE_NON_DATABASE_SERVICES = [
  "edge-runtime",
  "gotrue",
  "imgproxy",
  "kong",
  "logflare",
  "mailpit",
  "postgres-meta",
  "postgrest",
  "realtime",
  "storage-api",
  "studio",
  "supavisor",
  "vector",
]
let bootstrapWorkdir
let migrationsDirectory

function createBootstrapWorkdir() {
  const temporaryRoot = process.env.RUNNER_TEMP ?? os.tmpdir()
  bootstrapWorkdir = mkdtempSync(path.join(temporaryRoot, "cheffia-supabase-bootstrap-"))

  migrationsDirectory = path.join(bootstrapWorkdir, "supabase", "migrations")
  mkdirSync(migrationsDirectory, { recursive: true })
  cpSync(path.join(supabaseRoot, "config.toml"), path.join(bootstrapWorkdir, "supabase", "config.toml"))
  cpSync(
    path.join(supabaseRoot, "migrations", "00000000000000_prisma_baseline.sql"),
    path.join(migrationsDirectory, "00000000000000_prisma_baseline.sql"),
  )
}

function cleanupBootstrapWorkdir() {
  if (bootstrapWorkdir) {
    rmSync(bootstrapWorkdir, { recursive: true, force: true })
  }
}

// Supabase owns the complete database migration history. Prisma only generates
// and executes the application ORM client; it never migrates this database.
const LOCAL_DATABASE_URL =
  process.env.LOCAL_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
process.env.DATABASE_URL = LOCAL_DATABASE_URL
process.env.DIRECT_URL = LOCAL_DATABASE_URL

try {
  await measureCiStage("prepare migration bootstrap", createBootstrapWorkdir)

  // The database/RLS gate does not need the API, Auth, Storage, Realtime, or
  // dashboard containers. Avoid pulling those images on shared CI runners.
  const excludeServices = SUPABASE_NON_DATABASE_SERVICES.flatMap((service) => [
    "--exclude",
    service,
  ])
  await run("supabase", ["start", "--workdir", bootstrapWorkdir, ...excludeServices, "--yes"])
  await run("supabase", ["db", "reset", "--local", "--workdir", bootstrapWorkdir, "--no-seed", "--yes"])
  await measureCiStage("prepare Supabase migration history", () =>
    cpSync(supabaseRoot + "/migrations", migrationsDirectory, { recursive: true }),
  )
  await run("supabase", ["db", "push", "--local", "--workdir", bootstrapWorkdir, "--yes"])

  console.log("Local database migrations applied")
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(redact(message))
  process.exitCode = error?.exitCode ?? 1
} finally {
  await measureCiStage("clean up migration bootstrap", cleanupBootstrapWorkdir)
}
