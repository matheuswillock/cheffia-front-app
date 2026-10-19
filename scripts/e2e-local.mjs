import { spawnSync } from "node:child_process"
import { createHash, createHmac, randomUUID } from "node:crypto"
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { createClient } from "@supabase/supabase-js"
import pg from "pg"

const { Client } = pg
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const temporaryRoot = process.env.RUNNER_TEMP ?? "/tmp/opencode"
const workdir = mkdtempSync(path.join(temporaryRoot, "cheffia-e2e-supabase-"))
const supabaseWorkdir = path.join(workdir, "supabase")
const migrationsDirectory = path.join(supabaseWorkdir, "migrations")
const apiPort = 55721
const databasePort = 55722
const shadowPort = 55720
const e2eBaseUrl = "http://localhost:3100"
const tableSigningSecret = "e2e-table-secret"
const staffEmail = "kitchen.e2e@cheffia.local"
const staffPassword = "E2eKitchenPassword123!"

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    env: { ...process.env, ...env },
    stdio: "inherit",
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function createTableToken(tableId) {
  const payload = Buffer.from(
    JSON.stringify({ version: 1, tableId, nonce: "e2e-fixed-nonce" }),
  ).toString("base64url")
  const unsigned = `v1.${payload}`
  const signature = createHmac("sha256", tableSigningSecret).update(unsigned).digest("base64url")
  return `${unsigned}.${signature}`
}

function configureSupabase() {
  mkdirSync(migrationsDirectory, { recursive: true })
  cpSync(path.join(repositoryRoot, "supabase/config.toml"), path.join(supabaseWorkdir, "config.toml"))
  const configPath = path.join(supabaseWorkdir, "config.toml")
  return Bun.file(configPath).text().then((text) => {
    text = text
      .replace('project_id = "cheffia-front-app"', 'project_id = "cheffia-front-app-e2e"')
      .replace("port = 54321", `port = ${apiPort}`)
      .replace("port = 54322", `port = ${databasePort}`)
      .replace("shadow_port = 54320", `shadow_port = ${shadowPort}`)
    writeFileSync(configPath, text)
    cpSync(
      path.join(repositoryRoot, "supabase/migrations/00000000000000_prisma_baseline.sql"),
      path.join(migrationsDirectory, "00000000000000_prisma_baseline.sql"),
    )
  })
}

async function seedFixtures(status) {
  const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${databasePort}/postgres`
  const supabase = createClient(status.API_URL, status.SERVICE_ROLE_KEY)
  const created = await supabase.auth.admin.createUser({
    email: staffEmail,
    password: staffPassword,
    email_confirm: true,
  })
  if (created.error || !created.data.user) {
    throw created.error ?? new Error("Unable to create E2E staff user")
  }

  const tenantId = randomUUID()
  const restaurantId = randomUUID()
  const tableId = randomUUID()
  const token = createTableToken(tableId)
  const tokenHash = createHash("sha256").update(token).digest("hex")
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  try {
    await client.query("BEGIN")
    await client.query(
      "INSERT INTO public.tenants (id, slug, name) VALUES ($1, 'e2e-tenant', 'E2E Tenant')",
      [tenantId],
    )
    await client.query(
      "INSERT INTO public.restaurants (id, tenant_id, slug, name) VALUES ($1, $2, 'e2e-demo', 'E2E Demo')",
      [restaurantId, tenantId],
    )
    await client.query(
      "INSERT INTO public.restaurant_memberships (tenant_id, restaurant_id, user_id, role, status) VALUES ($1, $2, $3, 'kitchen', 'active')",
      [tenantId, restaurantId, created.data.user.id],
    )
    await client.query(
      "INSERT INTO public.restaurant_tables (id, tenant_id, restaurant_id, label, qr_token_hash) VALUES ($1, $2, $3, 'Mesa E2E', $4)",
      [tableId, tenantId, restaurantId, tokenHash],
    )
    const category = await client.query(
      "INSERT INTO public.menu_categories (tenant_id, restaurant_id, name, is_published) VALUES ($1, $2, 'E2E', true) RETURNING id",
      [tenantId, restaurantId],
    )
    await client.query(
      "INSERT INTO public.menu_items (tenant_id, restaurant_id, category_id, name, price_cents, currency, is_published, is_available) VALUES ($1, $2, $3, 'Burger E2E', 2500, 'BRL', true, true)",
      [tenantId, restaurantId, category.rows[0].id],
    )
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }

  return {
    databaseUrl,
    token,
    apiUrl: status.API_URL,
    anonKey: status.ANON_KEY,
  }
}

try {
  await configureSupabase()
  run("supabase", [
    "start",
    "--workdir",
    workdir,
    "--exclude",
    "edge-runtime",
    "--exclude",
    "imgproxy",
    "--exclude",
    "logflare",
    "--exclude",
    "mailpit",
    "--exclude",
    "postgres-meta",
    "--exclude",
    "storage-api",
    "--exclude",
    "studio",
    "--exclude",
    "supavisor",
    "--exclude",
    "vector",
    "--yes",
  ])
  run("supabase", ["db", "reset", "--local", "--workdir", workdir, "--no-seed", "--yes"])

  const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${databasePort}/postgres`
  run("bun", ["run", "prisma:migrate:deploy"], {
    DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
  })
  cpSync(path.join(repositoryRoot, "supabase/migrations"), migrationsDirectory, { recursive: true })
  run("supabase", ["db", "push", "--local", "--workdir", workdir, "--yes"])

  const status = JSON.parse(
    Bun.spawnSync(["supabase", "status", "--workdir", workdir, "-o", "json"], {
      cwd: repositoryRoot,
      stdout: "pipe",
      stderr: "inherit",
    }).stdout.toString(),
  )
  const fixtures = await seedFixtures(status)
  const env = {
    E2E_BASE_URL: e2eBaseUrl,
    E2E_DATABASE_URL: fixtures.databaseUrl,
    E2E_TABLE_QR_SIGNING_SECRET: tableSigningSecret,
    E2E_SUPABASE_URL: fixtures.apiUrl,
    E2E_SUPABASE_ANON_KEY: fixtures.anonKey,
    E2E_TABLE_TOKEN: fixtures.token,
    E2E_STAFF_EMAIL: staffEmail,
    E2E_STAFF_PASSWORD: staffPassword,
    PLAYWRIGHT_JSON_REPORT: process.env.PLAYWRIGHT_JSON_REPORT ?? "",
  }
  run("bun", ["run", "test:e2e"], env)
} finally {
  const stopResult = spawnSync(
    "supabase",
    ["stop", "--workdir", workdir, "--no-backup"],
    { cwd: repositoryRoot, env: process.env, stdio: "inherit" },
  )
  if (stopResult.status !== 0) {
    console.warn("Supabase cleanup returned a non-zero status; test results are preserved.")
  }
  rmSync(workdir, { recursive: true, force: true })
}
