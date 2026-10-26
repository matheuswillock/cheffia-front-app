import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { randomUUID } from "node:crypto"
import type pg from "pg"
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js"

import { createSupabaseRealtimeToken } from "@/business/order/realtimeToken"

import { createFixture, createOrder, createTestPool, type Fixture } from "./support/database"

// These tests run against the complete local stack started by `bun run test:realtime:local`.
// The runner exports the variables below; nothing here is read from a .env file.
function requireEnvironment(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Realtime tests need ${name}; run them with bun run test:realtime:local`)
  return value
}

const API_URL = requireEnvironment("API_URL")
const ANON_KEY = requireEnvironment("ANON_KEY")
const SERVICE_ROLE_KEY = requireEnvironment("SERVICE_ROLE_KEY")
const JWT_SECRET = requireEnvironment("JWT_SECRET")

const apiHost = new URL(API_URL).hostname
if (apiHost !== "127.0.0.1" && apiHost !== "localhost") {
  throw new Error("Realtime authorization tests only run against a local Supabase stack")
}

const EVENT = "order.updated"
// Positive deliveries must arrive well within this window. Negative checks wait a shorter
// window, and they only count as proof because the positive control passed first.
const DELIVERY_TIMEOUT_MS = 10_000
const DENIAL_WINDOW_MS = 2_500
const SUBSCRIBE_TIMEOUT_MS = 8_000

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: {
    logger(kind: string, message: string, data?: unknown) {
      if (kind === "error" || message.includes("error") || message.includes("close")) {
        console.error(`[realtime:${kind}] ${message}`, data ?? "")
      }
    },
  },
}
const server = createClient(API_URL, SERVICE_ROLE_KEY, clientOptions)
const openClients: SupabaseClient[] = []

function anonymousClient() {
  const client = createClient(API_URL, ANON_KEY, clientOptions)
  openClients.push(client)
  return client
}

type Listener = {
  channel: RealtimeChannel
  received: Array<{ marker?: string }>
  state: string
  error?: string
}

async function subscribe(client: SupabaseClient, topic: string): Promise<Listener> {
  const received: Array<{ marker?: string }> = []
  // supabase-js cannot subscribe the same topic twice on one client. Shared staff clients reach
  // here again from the control, so drop the earlier test's channel first.
  for (const existing of client.getChannels()) {
    if (existing.topic === `realtime:${topic}`) await client.removeChannel(existing)
  }
  const channel = client.channel(topic, { config: { private: true } })
  channel.on("broadcast", { event: EVENT }, (message) => {
    received.push(message.payload as { marker?: string })
  })
  let error: string | undefined
  const state = await new Promise<string>((resolve) => {
    const timer = setTimeout(() => resolve("LOCAL_TIMEOUT"), SUBSCRIBE_TIMEOUT_MS)
    channel.subscribe((status, reason) => {
      if (reason) error = reason.message
      if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        clearTimeout(timer)
        resolve(status)
      }
    })
  })
  return { channel, received, state, error }
}

async function broadcastFromServer(topic: string, marker: string) {
  // Same transport as the outbox publisher: the service role sends without subscribing.
  const channel = server.channel(topic, { config: { private: true } })
  try {
    const result = await channel.send({ type: "broadcast", event: EVENT, payload: { marker } })
    if (result !== "ok") throw new Error(`Broadcast to ${topic} returned ${result}`)
  } finally {
    await server.removeChannel(channel)
  }
}

async function deliveredWithin(listener: Listener, marker: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (listener.received.some((payload) => payload.marker === marker)) return true
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return listener.received.some((payload) => payload.marker === marker)
}

function expectSubscribed(listener: Listener, topic: string) {
  if (listener.state !== "SUBSCRIBED") {
    throw new Error(
      `Realtime subscription failed for ${topic}: state=${listener.state}; reason=${listener.error ?? "unavailable"}`,
    )
  }
}

async function attempt(listener: Listener, topic: string, timeoutMs: number) {
  const marker = randomUUID()
  await broadcastFromServer(topic, marker)
  return deliveredWithin(listener, marker, timeoutMs)
}

async function tableSessionClient(sessionId: string) {
  // Same wiring as useOrderRealtime. With accessToken alone, supabase-js joins the first time
  // with the anon key (the async token is not resolved yet) and Realtime denies the join; the
  // client only recovers on its own rejoin seconds later. Resolving the token first joins once,
  // with the table_session_id claim.
  const token = createSupabaseRealtimeToken({ sessionId, jwtSecret: JWT_SECRET })
  const client = createClient(API_URL, ANON_KEY, { ...clientOptions, accessToken: async () => token })
  openClients.push(client)
  await client.realtime.setAuth()
  return client
}

async function createSignedInUser() {
  const email = `realtime.${randomUUID()}@cheffia.local`
  const password = `Rt-${randomUUID()}-A1!`
  const created = await server.auth.admin.createUser({ email, password, email_confirm: true })
  if (created.error || !created.data.user) throw created.error ?? new Error("Unable to create realtime user")
  const client = anonymousClient()
  const session = await client.auth.signInWithPassword({ email, password })
  if (session.error || !session.data.session) throw session.error ?? new Error("Unable to sign in realtime user")
  client.realtime.setAuth(session.data.session.access_token)
  return { userId: created.data.user.id, client }
}

async function createStaffMember(pool: pg.Pool, fixture: Fixture, status: "active" | "revoked") {
  const user = await createSignedInUser()
  await pool.query(
    "insert into public.restaurant_memberships (tenant_id, restaurant_id, user_id, role, status) values ($1, $2, $3, 'kitchen', $4)",
    [fixture.tenantId, fixture.restaurantId, user.userId, status],
  )
  return user.client
}

async function createSessionWith(
  pool: pg.Pool,
  fixture: Fixture,
  status: "active" | "revoked",
  expiresSql: "now() + interval '1 hour'" | "now() - interval '1 minute'",
) {
  const suffix = randomUUID().slice(0, 8)
  const table = await pool.query<{ id: string }>(
    "insert into public.restaurant_tables (tenant_id, restaurant_id, label, qr_token_hash) values ($1, $2, $3, $4) returning id",
    [fixture.tenantId, fixture.restaurantId, `Mesa ${suffix}`, `qr-${suffix}`],
  )
  // expiresSql comes from the two literal values above, never from user input.
  const session = await pool.query<{ id: string }>(
    `insert into public.table_sessions (tenant_id, restaurant_id, table_id, token_hash, status, expires_at) values ($1, $2, $3, $4, $5, ${expiresSql}) returning id`,
    [fixture.tenantId, fixture.restaurantId, table.rows[0].id, `session-${suffix}`, status],
  )
  return { ...fixture, tableId: table.rows[0].id, sessionId: session.rows[0].id }
}

describe("private Broadcast authorization against the local Supabase stack", () => {
  let pool: pg.Pool
  let tenantA: Fixture
  let tenantB: Fixture
  let orderA: string
  let orderB: string
  let expiredSession: Fixture
  let expiredOrder: string
  let revokedSession: Fixture
  let revokedOrder: string
  let kitchenA: SupabaseClient
  let kitchenB: SupabaseClient
  let revokedKitchenA: SupabaseClient
  let stranger: SupabaseClient
  let control: Promise<void> | undefined

  beforeAll(async () => {
    pool = await createTestPool()
    tenantA = await createFixture(pool, { role: "kitchen" })
    tenantB = await createFixture(pool, { role: "kitchen" })
    orderA = await createOrder(pool, tenantA)
    orderB = await createOrder(pool, tenantB)

    expiredSession = await createSessionWith(pool, tenantA, "active", "now() - interval '1 minute'")
    expiredOrder = await createOrder(pool, expiredSession)
    revokedSession = await createSessionWith(pool, tenantA, "revoked", "now() + interval '1 hour'")
    revokedOrder = await createOrder(pool, revokedSession)

    kitchenA = await createStaffMember(pool, tenantA, "active")
    kitchenB = await createStaffMember(pool, tenantB, "active")
    revokedKitchenA = await createStaffMember(pool, tenantA, "revoked")
    // Signed in with a real session, but never granted a membership.
    stranger = (await createSignedInUser()).client
  })

  afterAll(async () => {
    for (const client of openClients) {
      await client.removeAllChannels()
    }
    await server.removeAllChannels()
    await pool.end()
  })

  // Every negative check runs this first. Without it, "nothing delivered" could just mean
  // the subscription or the transport is broken.
  function ensureControl() {
    control ??= (async () => {
      const ownTableSession = await subscribe(await tableSessionClient(tenantA.sessionId), `order:${orderA}`)
      expectSubscribed(ownTableSession, `order:${orderA}`)
      expect(await attempt(ownTableSession, `order:${orderA}`, DELIVERY_TIMEOUT_MS)).toBe(true)

      const otherTableSession = await subscribe(await tableSessionClient(tenantB.sessionId), `order:${orderB}`)
      expectSubscribed(otherTableSession, `order:${orderB}`)
      expect(await attempt(otherTableSession, `order:${orderB}`, DELIVERY_TIMEOUT_MS)).toBe(true)

      const ownKitchen = await subscribe(kitchenA, `restaurant:${tenantA.restaurantId}:orders`)
      expectSubscribed(ownKitchen, `restaurant:${tenantA.restaurantId}:orders`)
      expect(await attempt(ownKitchen, `restaurant:${tenantA.restaurantId}:orders`, DELIVERY_TIMEOUT_MS)).toBe(true)
    })()
    return control
  }

  describe("positive control", () => {
    test("a table session receives a broadcast on its own order topic", async () => {
      const listener = await subscribe(await tableSessionClient(tenantA.sessionId), `order:${orderA}`)
      expectSubscribed(listener, `order:${orderA}`)
      expect(await attempt(listener, `order:${orderA}`, DELIVERY_TIMEOUT_MS)).toBe(true)
    })

    test("an active kitchen member receives a broadcast on its own restaurant topic", async () => {
      const topic = `restaurant:${tenantA.restaurantId}:orders`
      const listener = await subscribe(kitchenA, topic)
      expectSubscribed(listener, topic)
      expect(await attempt(listener, topic, DELIVERY_TIMEOUT_MS)).toBe(true)
    })
  })

  test("a table session does not receive a broadcast for an order of another tenant", async () => {
    await ensureControl()
    const listener = await subscribe(await tableSessionClient(tenantA.sessionId), `order:${orderB}`)
    expect(await attempt(listener, `order:${orderB}`, DENIAL_WINDOW_MS)).toBe(false)
  })

  test("an expired table session does not receive a broadcast for its own order", async () => {
    await ensureControl()
    const listener = await subscribe(await tableSessionClient(expiredSession.sessionId), `order:${expiredOrder}`)
    expect(await attempt(listener, `order:${expiredOrder}`, DENIAL_WINDOW_MS)).toBe(false)
  })

  test("a table session whose status is not active does not receive a broadcast for its own order", async () => {
    await ensureControl()
    const listener = await subscribe(await tableSessionClient(revokedSession.sessionId), `order:${revokedOrder}`)
    expect(await attempt(listener, `order:${revokedOrder}`, DENIAL_WINDOW_MS)).toBe(false)
  })

  test("a kitchen member of another restaurant does not receive this restaurant's orders", async () => {
    await ensureControl()
    const listener = await subscribe(kitchenB, `restaurant:${tenantA.restaurantId}:orders`)
    expect(await attempt(listener, `restaurant:${tenantA.restaurantId}:orders`, DENIAL_WINDOW_MS)).toBe(false)
  })

  test("a revoked membership does not receive restaurant orders", async () => {
    await ensureControl()
    const listener = await subscribe(revokedKitchenA, `restaurant:${tenantA.restaurantId}:orders`)
    expect(await attempt(listener, `restaurant:${tenantA.restaurantId}:orders`, DENIAL_WINDOW_MS)).toBe(false)
  })

  test("a user without any membership does not receive restaurant orders", async () => {
    await ensureControl()
    const listener = await subscribe(stranger, `restaurant:${tenantA.restaurantId}:orders`)
    expect(await attempt(listener, `restaurant:${tenantA.restaurantId}:orders`, DENIAL_WINDOW_MS)).toBe(false)
  })

  test("orders is not published through supabase_realtime and the broadcast policies exist", async () => {
    const publication = await pool.query(
      "select 1 from pg_publication where pubname = 'supabase_realtime'",
    )
    expect(publication.rowCount).toBe(1)

    const orderTables = await pool.query(
      "select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'",
    )
    expect(orderTables.rowCount).toBe(0)

    const policies = await pool.query<{ policyname: string }>(
      "select policyname from pg_policies where schemaname = 'realtime' and tablename = 'messages'",
    )
    const names = policies.rows.map((row) => row.policyname)
    expect(names).toContain("table sessions receive own order broadcasts")
    expect(names).toContain("restaurant members receive restaurant order broadcasts")
  })
})
