import { spawnSync } from "node:child_process"

function redact(output) {
  return output
    .replace(
      /("?(?:ANON_KEY|SERVICE_ROLE_KEY|SECRET_KEY|JWT_SECRET|PUBLISHABLE_KEY|PASSWORD|TOKEN)"?\s*[:=]\s*"?)[^",\s}]+/gi,
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

  if (result.error) throw result.error
  if (result.status !== 0) {
    const output = redact(`${result.stdout ?? ""}\n${result.stderr ?? ""}`).trim()
    if (output) console.error(output)
    process.exit(result.status ?? 1)
  }
}

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DIRECT_URL

if (!databaseUrl) {
  throw new Error("DIRECT_URL or SUPABASE_DB_URL is required for the serialized migration job")
}

// Read both histories before mutating either one. The direct URL is supplied
// only to child processes and is never printed by this script.
run("bun", ["run", "prisma:migrate:status"])
run("supabase", ["migration", "list", "--db-url", databaseUrl])

// Prisma owns relational objects; Supabase owns RLS, triggers and extensions.
run("bun", ["run", "prisma:migrate:deploy"])
run("supabase", ["db", "push", "--db-url", databaseUrl, "--yes"])

console.log("Database migrations applied")
