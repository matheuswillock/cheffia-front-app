import { spawnSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

function redact(output) {
  return output
    .replace(
      /("?(?:ANON_KEY|SERVICE_ROLE_KEY|SECRET_KEY|JWT_SECRET|PUBLISHABLE_KEY|S3_PROTOCOL_ACCESS_KEY_ID|S3_PROTOCOL_ACCESS_KEY_SECRET|PASSWORD|TOKEN)"?\s*:\s*"?)[^",\s}]+/gi,
      "$1<redacted>",
    )
    .replace(/(postgres(?:ql)?:\/\/)[^\s"']+/gi, "$1<redacted>")
    .replace(/(eyJ[a-zA-Z0-9._-]+|sb_(?:publishable|secret)_[a-zA-Z0-9_-]+)/g, "<redacted>")
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: ["inherit", "pipe", "pipe"],
    encoding: "utf8",
    env: process.env,
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const output = redact(`${result.stdout ?? ""}\n${result.stderr ?? ""}`).trim()
    const error = new Error(output || `${command} exited with status ${result.status ?? 1}`)
    error.exitCode = result.status ?? 1
    throw error
  }
}

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const supabaseRoot = path.join(repositoryRoot, "supabase")
let bootstrapWorkdir

function createBootstrapWorkdir() {
  const temporaryRoot = process.env.RUNNER_TEMP ?? os.tmpdir()
  bootstrapWorkdir = mkdtempSync(path.join(temporaryRoot, "cheffia-supabase-bootstrap-"))

  const migrationsDirectory = path.join(bootstrapWorkdir, "supabase", "migrations")
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

// Supabase owns RLS/Realtime/Storage migrations while Prisma owns tables.
// Reset only the marker migration first, then apply both layers in order.
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
process.env.DIRECT_URL ??= process.env.DATABASE_URL

try {
  run("supabase", ["start"])
  createBootstrapWorkdir()
  run("supabase", ["db", "reset", "--local", "--workdir", bootstrapWorkdir, "--no-seed", "--yes"])
  run("bun", ["run", "prisma:migrate:deploy"])
  run("supabase", ["db", "push", "--local", "--yes"])

  console.log("Local database migrations applied")
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(redact(message))
  process.exitCode = error?.exitCode ?? 1
} finally {
  cleanupBootstrapWorkdir()
}
