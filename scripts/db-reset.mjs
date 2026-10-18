import { spawnSync } from "node:child_process"

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
    if (output) console.error(output)
    process.exit(result.status ?? 1)
  }
}

// Supabase owns RLS/Realtime/Storage migrations while Prisma owns tables.
// Reset the local Supabase history first, then apply both layers in order.
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
process.env.DIRECT_URL ??= process.env.DATABASE_URL

run("supabase", ["start"])
run("supabase", ["db", "reset", "--local", "--version", "00000000000000", "--no-seed", "--yes"])
run("bun", ["run", "prisma:migrate:deploy"])
run("supabase", ["db", "push", "--local", "--yes"])
