import pg from "pg"

const { Client } = pg
const LOCAL_DATABASE_URL =
  process.env.LOCAL_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
process.env.DATABASE_URL = LOCAL_DATABASE_URL

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const client = new Client({ connectionString: LOCAL_DATABASE_URL })

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
  const orderingTables = [
    "restaurant_tables",
    "table_sessions",
    "menu_categories",
    "menu_items",
    "modifier_groups",
    "modifiers",
    "menu_item_modifier_groups",
    "orders",
    "order_items",
    "order_item_modifiers",
    "order_state_transitions",
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

  const orderingTableResult = await client.query(
    `
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = ANY($1::text[])
    `,
    [orderingTables],
  )
  assert(
    orderingTableResult.rowCount === orderingTables.length,
    "ordering tables are incomplete",
  )
  assert(
    orderingTableResult.rows.every((row) => row.rowsecurity === true),
    "ordering RLS isolation failed",
  )

  const policyResult = await client.query(
    `
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'orders'
        AND policyname = 'orders_select_staff'
    `,
  )
  assert(policyResult.rowCount === 1, "orders staff policy is missing")

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
  const restaurantB = await client.query(
    `INSERT INTO public.restaurants (tenant_id, name) VALUES ($1, 'Restaurant B') RETURNING id`,
    [tenantB.rows[0].id],
  )
  await client.query(
    `
      INSERT INTO public.restaurant_memberships
        (tenant_id, restaurant_id, user_id, role)
      VALUES ($1, $2, $3, 'owner')
    `,
    [tenantA.rows[0].id, restaurantA.rows[0].id, "00000000-0000-0000-0000-000000000001"],
  )

  const tableA = await client.query(
    `
      INSERT INTO public.restaurant_tables
        (tenant_id, restaurant_id, label, qr_token_hash)
      VALUES ($1, $2, 'A1', 'hash-a')
      RETURNING id
    `,
    [tenantA.rows[0].id, restaurantA.rows[0].id],
  )
  const tableB = await client.query(
    `
      INSERT INTO public.restaurant_tables
        (tenant_id, restaurant_id, label, qr_token_hash)
      VALUES ($1, $2, 'B1', 'hash-b')
      RETURNING id
    `,
    [tenantB.rows[0].id, restaurantB.rows[0].id],
  )
  const sessionA = await client.query(
    `
      INSERT INTO public.table_sessions
        (tenant_id, restaurant_id, table_id, token_hash, expires_at)
      VALUES ($1, $2, $3, 'session-hash-a', now() + interval '1 hour')
      RETURNING id
    `,
    [tenantA.rows[0].id, restaurantA.rows[0].id, tableA.rows[0].id],
  )
  const sessionB = await client.query(
    `
      INSERT INTO public.table_sessions
        (tenant_id, restaurant_id, table_id, token_hash, expires_at)
      VALUES ($1, $2, $3, 'session-hash-b', now() + interval '1 hour')
      RETURNING id
    `,
    [tenantB.rows[0].id, restaurantB.rows[0].id, tableB.rows[0].id],
  )
  const categoryA = await client.query(
    `
      INSERT INTO public.menu_categories
        (tenant_id, restaurant_id, name, is_published)
      VALUES ($1, $2, 'Entradas', true)
      RETURNING id
    `,
    [tenantA.rows[0].id, restaurantA.rows[0].id],
  )
  await client.query(
    `
      INSERT INTO public.menu_items
        (tenant_id, restaurant_id, category_id, name, price_cents, is_published)
      VALUES ($1, $2, $3, 'Sopa', 1200, true)
    `,
    [tenantA.rows[0].id, restaurantA.rows[0].id, categoryA.rows[0].id],
  )
  await client.query(
    `
      INSERT INTO public.orders
        (tenant_id, restaurant_id, table_id, session_id, subtotal_cents, total_cents)
      VALUES ($1, $2, $3, $4, 1200, 1200)
    `,
    [tenantA.rows[0].id, restaurantA.rows[0].id, tableA.rows[0].id, sessionA.rows[0].id],
  )
  await client.query(
    `
      INSERT INTO public.orders
        (tenant_id, restaurant_id, table_id, session_id, subtotal_cents, total_cents)
      VALUES ($1, $2, $3, $4, 900, 900)
    `,
    [tenantB.rows[0].id, restaurantB.rows[0].id, tableB.rows[0].id, sessionB.rows[0].id],
  )

  const beforeAtomicity = await client.query(
    "SELECT (SELECT count(*) FROM public.orders) AS orders, (SELECT count(*) FROM public.outbox_events) AS outbox",
  )
  await client.query("SAVEPOINT atomic_order_outbox")
  const atomicOrder = await client.query(
    `
      INSERT INTO public.orders
        (tenant_id, restaurant_id, table_id, session_id, subtotal_cents, total_cents)
      VALUES ($1, $2, $3, $4, 500, 500)
      RETURNING id
    `,
    [tenantA.rows[0].id, restaurantA.rows[0].id, tableA.rows[0].id, sessionA.rows[0].id],
  )
  await client.query(
    `
      INSERT INTO public.outbox_events
        (tenant_id, restaurant_id, aggregate_type, aggregate_id, event_type, payload)
      VALUES ($1, $2, 'order', $3, 'order.created', '{"orderId":"atomic-check"}'::jsonb)
    `,
    [tenantA.rows[0].id, restaurantA.rows[0].id, atomicOrder.rows[0].id],
  )
  const duringAtomicity = await client.query(
    "SELECT (SELECT count(*) FROM public.orders) AS orders, (SELECT count(*) FROM public.outbox_events) AS outbox",
  )
  assert(
    Number(duringAtomicity.rows[0].orders) === Number(beforeAtomicity.rows[0].orders) + 1 &&
      Number(duringAtomicity.rows[0].outbox) === Number(beforeAtomicity.rows[0].outbox) + 1,
    "atomic order/outbox transaction did not persist both records",
  )
  await client.query("ROLLBACK TO SAVEPOINT atomic_order_outbox")
  const afterAtomicity = await client.query(
    "SELECT (SELECT count(*) FROM public.orders) AS orders, (SELECT count(*) FROM public.outbox_events) AS outbox",
  )
  assert(
    Number(afterAtomicity.rows[0].orders) === Number(beforeAtomicity.rows[0].orders) &&
      Number(afterAtomicity.rows[0].outbox) === Number(beforeAtomicity.rows[0].outbox),
    "failed transaction left ordering rows behind",
  )
  await client.query("RELEASE SAVEPOINT atomic_order_outbox")

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

  const visibleOrders = await client.query(
    "SELECT tenant_id FROM public.orders",
  )
  assert(visibleOrders.rowCount === 1, "ordering tenant isolation failed")
  assert(visibleOrders.rows[0].tenant_id === tenantA.rows[0].id, "wrong order tenant is visible")

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
