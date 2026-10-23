import { spawnSync } from "node:child_process"
import { createHash, createHmac, randomUUID } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { createClient } from "@supabase/supabase-js"
import pg from "pg"
import { assertLocalE2EPrerequisites } from "./e2e-preflight.mjs"
import { EXCLUDED_LOCAL_SERVICES, withLocalSupabase } from "./lib/supabase-local.mjs"

const { Client } = pg
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
assertLocalE2EPrerequisites()
const ports = { api: 55721, database: 55722, shadow: 55720 }
const e2eBaseUrl = "http://localhost:3100"
const tableSigningSecret = "e2e-table-secret"
const staffEmail = "kitchen.e2e@cheffia.local"
const staffPassword = "E2eKitchenPassword123!"

function createTableToken(tableId) {
  const payload = Buffer.from(
    JSON.stringify({ version: 1, tableId, nonce: "e2e-fixed-nonce" }),
  ).toString("base64url")
  const unsigned = `v1.${payload}`
  const signature = createHmac("sha256", tableSigningSecret).update(unsigned).digest("base64url")
  return `${unsigned}.${signature}`
}

async function seedFixtures(status, databaseUrl) {
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

await withLocalSupabase(
  {
    repositoryRoot,
    prefix: "cheffia-e2e-supabase-",
    projectId: "cheffia-front-app-e2e",
    ports,
    excludedServices: EXCLUDED_LOCAL_SERVICES,
  },
  async ({ status, databaseUrl }) => {
    const fixtures = await seedFixtures(status, databaseUrl)
    const env = {
      E2E_BASE_URL: e2eBaseUrl,
      E2E_DATABASE_URL: fixtures.databaseUrl,
      E2E_TABLE_QR_SIGNING_SECRET: tableSigningSecret,
      E2E_SUPABASE_JWT_SECRET: status.JWT_SECRET,
      E2E_SUPABASE_URL: fixtures.apiUrl,
      E2E_SUPABASE_ANON_KEY: fixtures.anonKey,
      E2E_SUPABASE_SECRET_KEY: status.SERVICE_ROLE_KEY,
      E2E_CRON_SECRET: "e2e-cron-secret",
      E2E_TABLE_TOKEN: fixtures.token,
      E2E_STAFF_EMAIL: staffEmail,
      E2E_STAFF_PASSWORD: staffPassword,
      PLAYWRIGHT_JSON_REPORT: process.env.PLAYWRIGHT_JSON_REPORT ?? "",
    }
    const result = spawnSync("bun", ["run", "test:e2e"], {
      cwd: repositoryRoot,
      env: { ...process.env, ...env },
      stdio: "inherit",
    })
    if (result.status !== 0) {
      throw new Error(`bun run test:e2e exited with ${result.status ?? 1}`)
    }
  },
)
