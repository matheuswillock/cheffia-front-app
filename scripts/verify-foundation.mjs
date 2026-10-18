import pg from "pg"

const { Client } = pg
const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const client = new Client({ connectionString })

await client.connect()

try {
  const requiredTables = [
    "tenants",
    "restaurants",
    "restaurant_memberships",
    "idempotency_keys",
    "outbox_events",
    "audit_logs",
  ]

  const tableResult = await client.query(
    `
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = ANY($1::text[])
    `,
    [requiredTables],
  )

  assert(
    tableResult.rowCount === requiredTables.length,
    "foundation tables are incomplete",
  )
  assert(
    tableResult.rows.every((row) => row.rowsecurity === true),
    "RLS is not enabled on every foundation table",
  )

  const prismaMigration = await client.query(
    `
      SELECT 1
      FROM _prisma_migrations
      WHERE migration_name = '20261018140000_foundation'
        AND finished_at IS NOT NULL
    `,
  )
  assert(prismaMigration.rowCount === 1, "Prisma foundation migration is not applied")

  await client.query("BEGIN")

  const tenantA = await client.query(
    `INSERT INTO public.tenants (slug, name) VALUES ('verify-a', 'Verify A') RETURNING id`,
  )
  const tenantB = await client.query(
    `INSERT INTO public.tenants (slug, name) VALUES ('verify-b', 'Verify B') RETURNING id`,
  )
  const restaurantA = await client.query(
    `INSERT INTO public.restaurants (tenant_id, name) VALUES ($1, 'Restaurant A') RETURNING id`,
    [tenantA.rows[0].id],
  )
  await client.query(
    `
      INSERT INTO public.restaurant_memberships
        (tenant_id, restaurant_id, user_id, role)
      VALUES ($1, $2, $3, 'owner')
    `,
    [tenantA.rows[0].id, restaurantA.rows[0].id, "00000000-0000-0000-0000-000000000001"],
  )

  await client.query("SET LOCAL ROLE authenticated")
  await client.query(
    `SELECT set_config('request.jwt.claim.sub', $1, true)`,
    ["00000000-0000-0000-0000-000000000001"],
  )

  const visibleTenants = await client.query(
    "SELECT id FROM public.tenants ORDER BY id",
  )
  assert(visibleTenants.rowCount === 1, "tenant isolation failed")
  assert(visibleTenants.rows[0].id === tenantA.rows[0].id, "wrong tenant is visible")

  const visibleRestaurants = await client.query(
    "SELECT tenant_id FROM public.restaurants",
  )
  assert(visibleRestaurants.rowCount === 1, "restaurant isolation failed")
  assert(
    visibleRestaurants.rows[0].tenant_id === tenantA.rows[0].id,
    "wrong restaurant tenant is visible",
  )

  const visibleMemberships = await client.query(
    "SELECT user_id FROM public.restaurant_memberships",
  )
  assert(visibleMemberships.rowCount === 1, "membership self-policy failed")

  let operationalAccessDenied = false
  try {
    await client.query("SELECT id FROM public.outbox_events")
  } catch (error) {
    operationalAccessDenied = error?.code === "42501"
  }
  assert(operationalAccessDenied, "operational tables are directly readable")

  // Keep the second tenant referenced so the isolation fixture cannot be optimized away.
  assert(tenantB.rows[0].id !== tenantA.rows[0].id, "fixture tenants are not distinct")

  await client.query("ROLLBACK")
  console.log("Foundation verification passed: schema, migration tracking and RLS")
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined)
  throw error
} finally {
  await client.end()
}
