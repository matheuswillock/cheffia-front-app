import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test"
import type pg from "pg"

import type { PendingOutboxEvent } from "@/business/order/publishOutbox"
import { createOutboxPublisherRepository } from "@/server/ordering/outboxPublisherRepository"
import { publishPendingOutbox } from "@/server/ordering/publishOutbox"

import {
  clearOutbox,
  createFixture,
  createOrder,
  createOutboxEvent,
  createTestPool,
  createTestPrisma,
  readOutboxEvent,
  type Fixture,
} from "./support/database"

const prisma = createTestPrisma()
let pool: pg.Pool
let fixture: Fixture
let orderId: string

beforeAll(async () => {
  pool = await createTestPool()
})

afterAll(async () => {
  await clearOutbox(pool)
  await prisma.$disconnect()
  await pool.end()
})

beforeEach(async () => {
  await clearOutbox(pool)
  fixture = await createFixture(pool)
  orderId = await createOrder(pool, fixture)
})

const repository = createOutboxPublisherRepository(prisma)

function recorder(failOn?: (topic: string, call: number) => boolean) {
  const topics: string[] = []
  const payloads: unknown[] = []
  return {
    topics,
    payloads,
    publish: async (topic: string, payload: unknown) => {
      topics.push(topic)
      payloads.push(payload)
      if (failOn?.(topic, topics.length)) throw new Error("transport down")
    },
  }
}

describe("outbox claim", () => {
  test("leases pending order events in sequence order and respects the batch limit", async () => {
    const first = await createOutboxEvent(pool, fixture, orderId)
    const second = await createOutboxEvent(pool, fixture, orderId)
    await createOutboxEvent(pool, fixture, orderId)

    const claimed = await repository.claim(2)

    expect(claimed.map((event) => event.id)).toEqual([first, second])
    const row = await readOutboxEvent(pool, first)
    expect(row.status).toBe("processing")
    expect(row.lease_token).toBe(claimed[0].leaseToken)
    expect(row.lease_expires_at!.getTime()).toBeGreaterThan(Date.now())
  })

  test("concurrent publishers never lease the same event", async () => {
    const created = await Promise.all(Array.from({ length: 30 }, () => createOutboxEvent(pool, fixture, orderId)))
    // One client (and connection pool) per publisher, as separate serverless instances would have.
    const publishers = Array.from({ length: 6 }, () => {
      const client = createTestPrisma()
      return { client, repository: createOutboxPublisherRepository(client) }
    })

    const runs = await Promise.all(publishers.map((publisher) => publisher.repository.claim(30)))
    await Promise.all(publishers.map((publisher) => publisher.client.$disconnect()))

    const claimedIds = runs.flat().map((event) => event.id)
    expect(new Set(claimedIds).size).toBe(claimedIds.length)
    expect([...claimedIds].sort()).toEqual([...created].sort())
  })

  test("reclaims an event whose lease expired after a publisher crash", async () => {
    const id = await createOutboxEvent(pool, fixture, orderId)
    const [stale] = await repository.claim(1)
    await pool.query("update public.outbox_events set lease_expires_at = now() - interval '1 second' where id = $1", [id])

    const [reclaimed] = await repository.claim(1)

    expect(reclaimed.id).toBe(id)
    expect(reclaimed.leaseToken).not.toBe(stale.leaseToken)
  })

  test("ignores events that are not due yet and non-order aggregates", async () => {
    const future = await createOutboxEvent(pool, fixture, orderId)
    await pool.query("update public.outbox_events set available_at = now() + interval '1 hour' where id = $1", [future])
    await pool.query(
      "insert into public.outbox_events (tenant_id, restaurant_id, aggregate_type, aggregate_id, event_type, payload) values ($1, $2, 'menu', 'x', 'menu.updated', '{}')",
      [fixture.tenantId, fixture.restaurantId],
    )

    expect(await repository.claim(10)).toEqual([])
  })
})

describe("outbox completion", () => {
  test("markPublished with the right lease publishes and clears the lease", async () => {
    const id = await createOutboxEvent(pool, fixture, orderId)
    const [event] = await repository.claim(1)

    expect(await repository.markPublished(event)).toBe(1)

    const row = await readOutboxEvent(pool, id)
    expect(row.status).toBe("published")
    expect(row.published_at).not.toBeNull()
    expect(row.lease_token).toBeNull()
  })

  test("markPublished with a stale lease changes nothing", async () => {
    const id = await createOutboxEvent(pool, fixture, orderId)
    const [event] = await repository.claim(1)
    const stale: PendingOutboxEvent = { ...event, leaseToken: "00000000-0000-4000-8000-000000000000" }

    expect(await repository.markPublished(stale)).toBe(0)

    const row = await readOutboxEvent(pool, id)
    expect(row.status).toBe("processing")
    expect(row.published_at).toBeNull()
  })
})

describe("publishPendingOutbox", () => {
  test("publishes both topics of an event and marks it published", async () => {
    const id = await createOutboxEvent(pool, fixture, orderId)
    const transport = recorder()

    const result = await publishPendingOutbox({ prisma, publish: transport.publish })

    expect(result).toEqual({ claimed: 1, published: 1, failed: 0 })
    expect(transport.topics).toEqual([`order:${orderId}`, `restaurant:${fixture.restaurantId}:orders`])
    expect((await readOutboxEvent(pool, id)).status).toBe("published")
  })

  test("a transport failure after commit returns the event to pending with backoff", async () => {
    const id = await createOutboxEvent(pool, fixture, orderId)
    const transport = recorder(() => true)

    const result = await publishPendingOutbox({ prisma, publish: transport.publish })

    expect(result).toEqual({ claimed: 1, published: 0, failed: 1 })
    const row = await readOutboxEvent(pool, id)
    expect(row.status).toBe("pending")
    expect(row.retry_count).toBe(1)
    expect(row.last_error).toBe("transport down")
    expect(row.lease_token).toBeNull()
    expect(row.lease_expires_at).toBeNull()
    expect(row.published_at).toBeNull()
    expect(row.in_future).toBe(true)
    expect(await repository.claim(10)).toEqual([])
  })

  test("after the backoff the event is retried and then published", async () => {
    const id = await createOutboxEvent(pool, fixture, orderId)
    await publishPendingOutbox({ prisma, publish: recorder(() => true).publish })
    await pool.query("update public.outbox_events set available_at = now() - interval '1 second' where id = $1", [id])
    const transport = recorder()

    const result = await publishPendingOutbox({ prisma, publish: transport.publish })

    expect(result).toEqual({ claimed: 1, published: 1, failed: 0 })
    const row = await readOutboxEvent(pool, id)
    expect(row.status).toBe("published")
    expect(row.last_error).toBeNull()
    expect(row.retry_count).toBe(1)
  })

  test("a failure on the second topic redelivers the first with the same event id", async () => {
    const id = await createOutboxEvent(pool, fixture, orderId)
    const failing = recorder((topic) => topic.startsWith("restaurant:"))
    await publishPendingOutbox({ prisma, publish: failing.publish })
    await pool.query("update public.outbox_events set available_at = now() - interval '1 second' where id = $1", [id])
    const retry = recorder()

    await publishPendingOutbox({ prisma, publish: retry.publish })

    const firstDelivery = failing.payloads[0] as { eventId: string }
    const secondDelivery = retry.payloads[0] as { eventId: string }
    expect(firstDelivery.eventId).toBe(id)
    expect(secondDelivery.eventId).toBe(id)
    expect(retry.topics[0]).toBe(`order:${orderId}`)
  })

  test("the tenth consecutive failure parks the event as failed", async () => {
    const id = await createOutboxEvent(pool, fixture, orderId)
    await pool.query("update public.outbox_events set retry_count = 9 where id = $1", [id])

    await publishPendingOutbox({ prisma, publish: recorder(() => true).publish })

    const row = await readOutboxEvent(pool, id)
    expect(row.status).toBe("failed")
    expect(row.retry_count).toBe(10)
    await pool.query("update public.outbox_events set available_at = now() - interval '1 second' where id = $1", [id])
    expect(await repository.claim(10)).toEqual([])
  })

  test("an event whose payload does not match its aggregate is not broadcast", async () => {
    const id = await createOutboxEvent(pool, fixture, orderId, {
      payload: { orderId: "someone-else", status: "pending", version: 1 },
    })
    const transport = recorder()

    const result = await publishPendingOutbox({ prisma, publish: transport.publish })

    expect(result.failed).toBe(1)
    expect(transport.topics).toEqual([])
    expect((await readOutboxEvent(pool, id)).last_error).toBe("INVALID_ORDER_OUTBOX_PAYLOAD")
  })
})
