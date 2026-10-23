import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type pg from "pg"

import { createSupabaseRealtimeToken } from "@/business/order/realtimeToken"

import { createFixture, createOrder, createTestPool, type Fixture } from "./support/database"

// Regression: has_table_session read the legacy request.jwt.claim.table_session_id setting,
// which PostgREST does not fill. A valid table-session token therefore never read its own
// order through the Data API. Needs PostgREST, so it runs with the full stack from
// `bun run test:realtime:local`.
function requireEnvironment(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Data API tests need ${name}; run them with bun run test:realtime:local`)
  return value
}

const API_URL = requireEnvironment("API_URL")
const ANON_KEY = requireEnvironment("ANON_KEY")
const JWT_SECRET = requireEnvironment("JWT_SECRET")

const apiHost = new URL(API_URL).hostname
if (apiHost !== "127.0.0.1" && apiHost !== "localhost") {
  throw new Error("Data API authorization tests only run against a local Supabase stack")
}

async function readOrderIds(bearer: string) {
  const response = await fetch(`${API_URL}/rest/v1/orders?select=id`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${bearer}` },
  })
  expect(response.status).toBe(200)
  return ((await response.json()) as Array<{ id: string }>).map((row) => row.id).sort()
}

describe("orders through the Data API with a table-session token", () => {
  let pool: pg.Pool
  let tenantA: Fixture
  let tenantB: Fixture
  let orderA: string
  let secondOrderA: string
  let orderB: string

  beforeAll(async () => {
    pool = await createTestPool()
    tenantA = await createFixture(pool, { role: "kitchen" })
    tenantB = await createFixture(pool, { role: "kitchen" })
    orderA = await createOrder(pool, tenantA)
    secondOrderA = await createOrder(pool, tenantA)
    orderB = await createOrder(pool, tenantB)
  })

  afterAll(async () => {
    await pool.end()
  })

  test("a table session reads exactly the orders of its own session", async () => {
    const token = createSupabaseRealtimeToken({ sessionId: tenantA.sessionId, jwtSecret: JWT_SECRET })
    expect(await readOrderIds(token)).toEqual([orderA, secondOrderA].sort())
  })

  test("a table session never reads the orders of another tenant", async () => {
    const token = createSupabaseRealtimeToken({ sessionId: tenantA.sessionId, jwtSecret: JWT_SECRET })
    expect(await readOrderIds(token)).not.toContain(orderB)
  })

  test("the anon key without a table session reads no orders", async () => {
    expect(await readOrderIds(ANON_KEY)).toEqual([])
  })
})
