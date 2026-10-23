import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import type pg from "pg"

import { createTestPool } from "./support/database"

// Regression for the table-session Broadcast policy. Before 20261022100000, anon had no
// privilege on public.table_sessions, so the policy failed with "permission denied" and a
// table session could never receive its own order. This suite runs the migration SQL and
// the policy inside one transaction that is always rolled back; it writes nothing.
const migration = readFileSync(
  path.join(import.meta.dir, "../../supabase/migrations/20261022100000_table_session_broadcast_authorization.sql"),
  "utf8",
)

let pool: pg.Pool

beforeAll(async () => {
  pool = await createTestPool()
})

afterAll(async () => {
  await pool.end()
})

describe("table-session Broadcast policy", () => {
  test("anon keeps no direct privilege on table_sessions, which holds token_hash", async () => {
    const result = await pool.query<{ allowed: boolean }>(
      "select has_table_privilege('anon', 'public.table_sessions', 'SELECT') as allowed",
    )
    expect(result.rows[0].allowed).toBe(false)
  })

  test("a table session receives only its own active order and the policy grants nothing else", async () => {
    const client = await pool.connect()
    try {
      await client.query("BEGIN")
      await client.query(migration)

      const suffix = randomUUID().slice(0, 8)
      const insert = async (sql: string, params: unknown[]) => (await client.query<{ id: string }>(sql, params)).rows[0].id
      const tenantA = await insert("insert into public.tenants (slug, name) values ($1, 'A') returning id", [`bp-a-${suffix}`])
      const tenantB = await insert("insert into public.tenants (slug, name) values ($1, 'B') returning id", [`bp-b-${suffix}`])
      const restaurantA = await insert(
        "insert into public.restaurants (tenant_id, name, slug) values ($1, 'RA', $2) returning id",
        [tenantA, `bp-ra-${suffix}`],
      )
      const restaurantB = await insert(
        "insert into public.restaurants (tenant_id, name, slug) values ($1, 'RB', $2) returning id",
        [tenantB, `bp-rb-${suffix}`],
      )

      const session = async (tenantId: string, restaurantId: string, status: string, expiresSql: string, tag: string) => {
        const tableId = await insert(
          "insert into public.restaurant_tables (tenant_id, restaurant_id, label, qr_token_hash) values ($1, $2, $3, $4) returning id",
          [tenantId, restaurantId, `Mesa ${tag} ${suffix}`, `qt-${tag}-${suffix}`],
        )
        // expiresSql is one of two literals defined in this file, never user input.
        const sessionId = await insert(
          `insert into public.table_sessions (tenant_id, restaurant_id, table_id, token_hash, status, expires_at) values ($1, $2, $3, $4, $5, ${expiresSql}) returning id`,
          [tenantId, restaurantId, tableId, `th-${tag}-${suffix}`, status],
        )
        const orderId = await insert(
          "insert into public.orders (tenant_id, restaurant_id, table_id, session_id, status, subtotal_cents, total_cents) values ($1, $2, $3, $4, 'pending', 1000, 1000) returning id",
          [tenantId, restaurantId, tableId, sessionId],
        )
        await client.query(
          "insert into realtime.messages (id, topic, extension, event, payload, private, inserted_at, updated_at) values (gen_random_uuid(), $1, 'broadcast', 'order.updated', '{}'::jsonb, true, now(), now())",
          [`order:${orderId}`],
        )
        return { sessionId, orderId }
      }

      const active = await session(tenantA, restaurantA, "active", "now() + interval '1 hour'", "active")
      const otherTenant = await session(tenantB, restaurantB, "active", "now() + interval '1 hour'", "other")
      const expired = await session(tenantA, restaurantA, "active", "now() - interval '1 minute'", "expired")
      const revoked = await session(tenantA, restaurantA, "revoked", "now() + interval '1 hour'", "revoked")

      const kitchenA = randomUUID()
      const kitchenB = randomUUID()
      const revokedMember = randomUUID()
      const stranger = randomUUID()
      for (const [tenantId, restaurantId, userId, status] of [
        [tenantA, restaurantA, kitchenA, "active"],
        [tenantB, restaurantB, kitchenB, "active"],
        [tenantA, restaurantA, revokedMember, "revoked"],
      ]) {
        await client.query(
          "insert into public.restaurant_memberships (tenant_id, restaurant_id, user_id, role, status) values ($1, $2, $3, 'kitchen', $4)",
          [tenantId, restaurantId, userId, status],
        )
      }

      // Joinable means the policy returned at least one realtime.messages row for this topic and claim set.
      const joinable = async (role: "anon" | "authenticated", claims: Record<string, string>, topic: string) => {
        await client.query(`set local role ${role}`)
        await client.query(
          "select set_config('request.jwt.claims', $1, true), set_config('realtime.topic', $2, true)",
          [JSON.stringify({ role, ...claims }), topic],
        )
        const result = await client.query<{ joinable: boolean }>("select exists (select 1 from realtime.messages) as joinable")
        await client.query("reset role")
        return result.rows[0].joinable
      }

      const tableClaims = (sessionId: string) => ({ table_session_id: sessionId })
      const memberClaims = (userId: string) => ({ sub: userId })

      expect(await joinable("anon", tableClaims(active.sessionId), `order:${active.orderId}`)).toBe(true)
      expect(await joinable("anon", tableClaims(active.sessionId), `order:${otherTenant.orderId}`)).toBe(false)
      expect(await joinable("anon", tableClaims(expired.sessionId), `order:${expired.orderId}`)).toBe(false)
      expect(await joinable("anon", tableClaims(revoked.sessionId), `order:${revoked.orderId}`)).toBe(false)
      expect(await joinable("authenticated", memberClaims(kitchenA), `restaurant:${restaurantA}:orders`)).toBe(true)
      expect(await joinable("authenticated", memberClaims(kitchenB), `restaurant:${restaurantA}:orders`)).toBe(false)
      expect(await joinable("authenticated", memberClaims(revokedMember), `restaurant:${restaurantA}:orders`)).toBe(false)
      expect(await joinable("authenticated", memberClaims(stranger), `restaurant:${restaurantA}:orders`)).toBe(false)
    } finally {
      await client.query("ROLLBACK")
      client.release()
    }
  })
})
