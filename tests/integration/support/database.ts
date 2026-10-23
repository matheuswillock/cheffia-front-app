import { randomUUID } from "node:crypto"

import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

import { PrismaClient } from "@/generated/prisma/client"

const LOCAL_DATABASE_URL =
  process.env.LOCAL_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

// These suites delete rows. They must never run against a shared or remote database.
const host = new URL(LOCAL_DATABASE_URL).hostname
if (host !== "127.0.0.1" && host !== "localhost") {
  throw new Error("Integration tests only run against a local database")
}

export const databaseUrl = LOCAL_DATABASE_URL

export function createTestPrisma() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: LOCAL_DATABASE_URL }) })
}

export async function createTestPool() {
  const pool = new pg.Pool({ connectionString: LOCAL_DATABASE_URL, max: 4 })
  await pool.query("select 1")
  return pool
}

export type Fixture = {
  tenantId: string
  restaurantId: string
  restaurantSlug: string
  tableId: string
  sessionId: string
  userId: string
}

export async function createFixture(
  pool: pg.Pool,
  options: { role?: "owner" | "manager" | "kitchen" | "waiter"; slug?: string } = {},
): Promise<Fixture> {
  const suffix = randomUUID().slice(0, 8)
  const restaurantSlug = options.slug ?? `it-${suffix}`
  const userId = randomUUID()
  const tenant = await pool.query<{ id: string }>(
    "insert into public.tenants (slug, name) values ($1, $2) returning id",
    [`tenant-${suffix}`, `Tenant ${suffix}`],
  )
  const tenantId = tenant.rows[0].id
  const restaurant = await pool.query<{ id: string }>(
    "insert into public.restaurants (tenant_id, name, slug) values ($1, $2, $3) returning id",
    [tenantId, `Restaurant ${suffix}`, restaurantSlug],
  )
  const restaurantId = restaurant.rows[0].id
  await pool.query(
    "insert into public.restaurant_memberships (tenant_id, restaurant_id, user_id, role, status) values ($1, $2, $3, $4, 'active')",
    [tenantId, restaurantId, userId, options.role ?? "kitchen"],
  )
  const table = await pool.query<{ id: string }>(
    "insert into public.restaurant_tables (tenant_id, restaurant_id, label, qr_token_hash) values ($1, $2, $3, $4) returning id",
    [tenantId, restaurantId, `Mesa ${suffix}`, `qr-${suffix}`],
  )
  const tableId = table.rows[0].id
  const session = await pool.query<{ id: string }>(
    "insert into public.table_sessions (tenant_id, restaurant_id, table_id, token_hash, expires_at) values ($1, $2, $3, $4, now() + interval '1 hour') returning id",
    [tenantId, restaurantId, tableId, `session-${suffix}`],
  )

  return { tenantId, restaurantId, restaurantSlug, tableId, sessionId: session.rows[0].id, userId }
}

export async function createOrder(
  pool: pg.Pool,
  fixture: Fixture,
  status: "pending" | "confirmed" | "preparing" | "ready" = "pending",
) {
  const order = await pool.query<{ id: string }>(
    "insert into public.orders (tenant_id, restaurant_id, table_id, session_id, status, subtotal_cents, total_cents) values ($1, $2, $3, $4, $5, 1000, 1000) returning id",
    [fixture.tenantId, fixture.restaurantId, fixture.tableId, fixture.sessionId, status],
  )
  return order.rows[0].id
}

export async function createOutboxEvent(
  pool: pg.Pool,
  fixture: Fixture,
  orderId: string,
  overrides: { status?: string; payload?: unknown } = {},
) {
  const event = await pool.query<{ id: string }>(
    "insert into public.outbox_events (tenant_id, restaurant_id, aggregate_type, aggregate_id, event_type, payload, status) values ($1, $2, 'order', $3, 'order.status_changed', $4::jsonb, $5::public.outbox_status) returning id",
    [
      fixture.tenantId,
      fixture.restaurantId,
      orderId,
      JSON.stringify(overrides.payload ?? { orderId, status: "pending", version: 1 }),
      overrides.status ?? "pending",
    ],
  )
  return event.rows[0].id
}

export async function readOutboxEvent(pool: pg.Pool, id: string) {
  const result = await pool.query(
    "select status::text as status, retry_count, last_error, published_at, lease_token, lease_expires_at, available_at, available_at > now() as in_future from public.outbox_events where id = $1",
    [id],
  )
  return result.rows[0] as {
    status: string
    retry_count: number
    last_error: string | null
    published_at: Date | null
    lease_token: string | null
    lease_expires_at: Date | null
    available_at: Date
    in_future: boolean
  }
}

export async function clearOutbox(pool: pg.Pool) {
  await pool.query("delete from public.outbox_events")
}
