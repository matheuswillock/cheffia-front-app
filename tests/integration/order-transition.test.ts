import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type pg from "pg"

import { OrderTransitionRuleError, transitionOrderForStaff } from "@/business/order/transitionOrder"
import { createOrderTransitionRepository } from "@/server/ordering/transitionOrderRepository"

import { createFixture, createOrder, createTestPool, createTestPrisma } from "./support/database"

const prisma = createTestPrisma()
const repository = createOrderTransitionRepository(prisma)
let pool: pg.Pool

beforeAll(async () => {
  pool = await createTestPool()
})

afterAll(async () => {
  await prisma.$disconnect()
  await pool.end()
})

async function orderState(orderId: string) {
  const order = await pool.query("select status::text as status, version from public.orders where id = $1", [orderId])
  const transitions = await pool.query(
    "select from_status::text as from_status, to_status::text as to_status, reason, actor_role from public.order_state_transitions where order_id = $1 order by created_at",
    [orderId],
  )
  const outbox = await pool.query("select payload from public.outbox_events where aggregate_id = $1", [orderId])
  return { order: order.rows[0], transitions: transitions.rows, outbox: outbox.rows }
}

async function setup(role: "kitchen" | "manager" | "waiter" = "kitchen") {
  const fixture = await createFixture(pool, { role })
  const orderId = await createOrder(pool, fixture, "pending")
  return { fixture, orderId }
}

describe("kitchen rejection", () => {
  test("persists the trimmed reason, the transition audit row and the outbox event", async () => {
    const { fixture, orderId } = await setup("kitchen")

    const result = await transitionOrderForStaff({
      repository,
      orderId,
      restaurantSlug: fixture.restaurantSlug,
      userId: fixture.userId,
      nextStatus: "rejected",
      reason: "  Sem estoque de carne  ",
    })

    expect(result).toEqual({ orderId, status: "rejected", version: 2 })
    const state = await orderState(orderId)
    expect(state.order).toEqual({ status: "rejected", version: 2 })
    expect(state.transitions).toEqual([
      { from_status: "pending", to_status: "rejected", reason: "Sem estoque de carne", actor_role: "kitchen" },
    ])
    expect(state.outbox).toHaveLength(1)
    expect(state.outbox[0].payload).toMatchObject({ orderId, status: "rejected", version: 2 })
  })

  test("refuses a rejection without a reason and leaves no trace", async () => {
    const { fixture, orderId } = await setup("manager")

    await expect(
      transitionOrderForStaff({
        repository,
        orderId,
        restaurantSlug: fixture.restaurantSlug,
        userId: fixture.userId,
        nextStatus: "rejected",
        reason: "   ",
      }),
    ).rejects.toBeInstanceOf(OrderTransitionRuleError)

    const state = await orderState(orderId)
    expect(state.order).toEqual({ status: "pending", version: 1 })
    expect(state.transitions).toEqual([])
    expect(state.outbox).toEqual([])
  })

  test("a waiter cannot reject, even with a reason", async () => {
    const { fixture, orderId } = await setup("waiter")

    await expect(
      transitionOrderForStaff({
        repository,
        orderId,
        restaurantSlug: fixture.restaurantSlug,
        userId: fixture.userId,
        nextStatus: "rejected",
        reason: "Sem estoque",
      }),
    ).rejects.toMatchObject({ code: "ORDER_TRANSITION_NOT_ALLOWED" })
    expect((await orderState(orderId)).order.status).toBe("pending")
  })

  test("a member of another tenant cannot see or change the order", async () => {
    const { orderId } = await setup("kitchen")
    const stranger = await createFixture(pool, { role: "kitchen" })

    await expect(
      transitionOrderForStaff({
        repository,
        orderId,
        restaurantSlug: stranger.restaurantSlug,
        userId: stranger.userId,
        nextStatus: "rejected",
        reason: "Sem estoque",
      }),
    ).rejects.toMatchObject({ code: "ORDER_NOT_FOUND_OR_FORBIDDEN" })
    expect((await orderState(orderId)).order.status).toBe("pending")
  })

  test("the same idempotency key replays the first result without a second transition", async () => {
    const { fixture, orderId } = await setup("kitchen")
    const input = {
      repository,
      orderId,
      restaurantSlug: fixture.restaurantSlug,
      userId: fixture.userId,
      nextStatus: "rejected" as const,
      reason: "Sem estoque",
      idempotency: {
        method: "POST",
        endpoint: `/api/restaurants/${fixture.restaurantSlug}/orders/${orderId}/transitions`,
        idempotencyKey: "reject-1",
        requestHash: "hash-reject",
      },
    }

    const first = await transitionOrderForStaff(input)
    const replay = await transitionOrderForStaff(input)

    expect(replay).toEqual(first)
    expect((await orderState(orderId)).transitions).toHaveLength(1)
    await expect(
      transitionOrderForStaff({ ...input, idempotency: { ...input.idempotency, requestHash: "other-hash" } }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_REUSE" })
  })
})
