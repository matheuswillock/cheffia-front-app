import { spawnSync } from "node:child_process"
import { readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { createSupabaseTestEnvironment, withLocalSupabase } from "./lib/supabase-local.mjs"

// Realtime Broadcast authorization needs the complete local stack (Realtime, Auth,
// the API gateway and PostgREST). The database job only starts the database, so
// it must never run these files.
const REALTIME_TEST_PATTERN = /^realtime-.*\.test\.ts$/
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function realtimeTestFiles() {
  const testsDirectory = path.join(repositoryRoot, "tests/integration")
  const files = readdirSync(testsDirectory)
    .filter((name) => REALTIME_TEST_PATTERN.test(name))
    .sort()
    .map((name) => path.join("tests/integration", name))
  if (files.length === 0) {
    throw new Error("No realtime integration tests were found under tests/integration")
  }
  return files
}

if (!process.argv.includes("--realtime")) {
  console.error("Usage: bun scripts/integration-local.mjs --realtime")
  process.exitCode = 2
} else {
  try {
    const files = realtimeTestFiles()
    await withLocalSupabase(
      {
        repositoryRoot,
        prefix: "cheffia-realtime-supabase-",
        projectId: "cheffia-front-app-realtime",
        ports: { api: 55731, database: 55732, shadow: 55730 },
      },
      async ({ status, databaseUrl }) => {
        const environment = createSupabaseTestEnvironment(status, { databaseUrl })
        const result = spawnSync("bun", ["test", ...files], {
          cwd: repositoryRoot,
          env: { ...process.env, ...environment },
          stdio: "inherit",
        })
        if (result.status !== 0) {
          throw new Error(`realtime integration tests exited with ${result.status ?? 1}`)
        }
      },
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
