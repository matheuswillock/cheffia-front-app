import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

import {
  EXCLUDED_LOCAL_SERVICES,
  createSupabaseTestEnvironment,
  rewriteSupabaseConfig,
} from "../../scripts/lib/supabase-local.mjs"

const repositoryRoot = path.resolve(import.meta.dir, "../..")

test("rewrites the project id and the API, database and shadow ports of a copied config", () => {
  const original = [
    'project_id = "cheffia-front-app"',
    "[api]",
    "port = 54321",
    "[db]",
    "port = 54322",
    "shadow_port = 54320",
    "",
  ].join("\n")

  const rewritten = rewriteSupabaseConfig(original, {
    projectId: "cheffia-front-app-realtime",
    apiPort: 55731,
    databasePort: 55732,
    shadowPort: 55730,
  })

  expect(rewritten).toContain('project_id = "cheffia-front-app-realtime"')
  expect(rewritten).toContain("port = 55731")
  expect(rewritten).toContain("port = 55732")
  expect(rewritten).toContain("shadow_port = 55730")
  expect(rewritten).not.toContain("54321")
  expect(rewritten).not.toContain("54322")
})

test("excludes only the services that realtime and the database tests do not need", () => {
  expect(EXCLUDED_LOCAL_SERVICES).toEqual([
    "edge-runtime",
    "imgproxy",
    "logflare",
    "mailpit",
    "postgres-meta",
    "storage-api",
    "studio",
    "supavisor",
    "vector",
  ])
  for (const service of ["realtime", "gotrue", "kong", "postgrest"]) {
    expect(EXCLUDED_LOCAL_SERVICES).not.toContain(service)
  }
})

test("maps the Supabase status to the names exported to the test process", () => {
  const environment = createSupabaseTestEnvironment(
    {
      API_URL: "http://127.0.0.1:55731",
      ANON_KEY: "anon-test-value",
      SERVICE_ROLE_KEY: "service-test-value",
      JWT_SECRET: "jwt-test-value",
    },
    { databaseUrl: "postgresql://postgres:postgres@127.0.0.1:55732/postgres" },
  )

  expect(environment).toEqual({
    API_URL: "http://127.0.0.1:55731",
    ANON_KEY: "anon-test-value",
    SERVICE_ROLE_KEY: "service-test-value",
    JWT_SECRET: "jwt-test-value",
    DB_URL: "postgresql://postgres:postgres@127.0.0.1:55732/postgres",
    LOCAL_DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:55732/postgres",
  })
})

test("refuses to start realtime tests when the Supabase status lacks a required value", () => {
  expect(() =>
    createSupabaseTestEnvironment(
      { API_URL: "http://127.0.0.1:55731", ANON_KEY: "a", SERVICE_ROLE_KEY: "s" },
      { databaseUrl: "postgresql://postgres:postgres@127.0.0.1:55732/postgres" },
    ),
  ).toThrow("supabase status is missing JWT_SECRET")
})

test("E2E and realtime runners share one Supabase lifecycle with guaranteed cleanup", () => {
  const e2e = readFileSync(path.join(repositoryRoot, "scripts/e2e-local.mjs"), "utf8")
  const realtime = readFileSync(path.join(repositoryRoot, "scripts/integration-local.mjs"), "utf8")

  expect(e2e).toContain('from "./lib/supabase-local.mjs"')
  expect(e2e).toContain("withLocalSupabase(")
  expect(realtime).toContain('from "./lib/supabase-local.mjs"')
  expect(realtime).toContain("withLocalSupabase(")
})
