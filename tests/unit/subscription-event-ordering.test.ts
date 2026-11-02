// T13 — Evento fora de ordem não rebaixa assinatura ativa
import { expect, test, describe, mock } from "bun:test"
import { createSubscriptionRepository } from "@/server/billing/subscriptionRepository"
import type { SubscriptionPlan, BillingCycle, SubscriptionStatus } from "@/generated/prisma/client"

function makeFakeDb(
  existingPeriodStart: Date | null = null,
  existingStatus: SubscriptionStatus = "active",
) {
  const createCalls: unknown[] = []
  const updateManyCalls: unknown[] = []

  return {
    subscription: {
      create: mock(async (args: unknown) => { createCalls.push(args) }),
      updateMany: mock(async (args: unknown) => { updateManyCalls.push(args) }),
      findUnique: mock(async (args: unknown) => {
        if (!existingPeriodStart) return null
        const select = (args as { select?: Record<string, boolean> }).select
        const selected: Record<string, unknown> = { currentPeriodStart: existingPeriodStart, status: existingStatus }
        return Object.fromEntries(Object.entries(selected).filter(([key]) => select?.[key]))
      }),
    },
    _calls: { createCalls, updateManyCalls },
  }
}

const CURRENT_PERIOD_START = new Date("2026-11-01T00:00:00Z")
const OLDER_PERIOD_START = new Date("2026-10-01T00:00:00Z")
const NEWER_PERIOD_START = new Date("2026-12-01T00:00:00Z")

const BASE_INPUT = {
  stripeSubscriptionId: "sub_test123",
  stripeCustomerId: "cus_test456",
  stripePriceId: "price_test789",
  plan: "basic" as SubscriptionPlan,
  billingCycle: "monthly" as BillingCycle,
  status: "active" as SubscriptionStatus,
  currentPeriodStart: CURRENT_PERIOD_START,
  currentPeriodEnd: new Date("2026-12-01T00:00:00Z"),
  cancelAtPeriodEnd: false,
  tenantId: "tenant-uuid-1",
  restaurantId: "restaurant-uuid-1",
}

describe("T13 — out-of-order event does not downgrade active subscription", () => {
  test("newer event updates status when currentPeriodStart is more recent", async () => {
    // Existing record has OLDER_PERIOD_START; incoming event has CURRENT_PERIOD_START (newer) → update applies
    const db = makeFakeDb(OLDER_PERIOD_START)
    const repo = createSubscriptionRepository(db as never)

    await repo.upsertByStripeSubscriptionId({ ...BASE_INPUT, status: "active" })

    expect(db.subscription.updateMany).toHaveBeenCalledTimes(1)
    const call = db._calls.updateManyCalls[0] as { data: Record<string, unknown> }
    expect(call.data.status).toBe("active")
    expect(call.data.currentPeriodStart).toEqual(CURRENT_PERIOD_START)
  })

  test("same-period event is applied (idempotent retry)", async () => {
    const db = makeFakeDb(CURRENT_PERIOD_START)
    const repo = createSubscriptionRepository(db as never)

    await repo.upsertByStripeSubscriptionId({ ...BASE_INPUT, status: "active" })

    expect(db.subscription.updateMany).toHaveBeenCalledTimes(1)
    const call = db._calls.updateManyCalls[0] as { data: Record<string, unknown> }
    expect(call.data.status).toBe("active")
  })

  test("older event does NOT update status — prevents downgrade from active to past_due", async () => {
    // Existing record has NEWER_PERIOD_START; incoming event has CURRENT_PERIOD_START (older) → no status update
    const db = makeFakeDb(NEWER_PERIOD_START)
    const repo = createSubscriptionRepository(db as never)

    await repo.upsertByStripeSubscriptionId({ ...BASE_INPUT, status: "past_due" })

    expect(db.subscription.updateMany).toHaveBeenCalledTimes(1)
    const call = db._calls.updateManyCalls[0] as { data: Record<string, unknown> }
    // status must NOT be in the update payload for stale events
    expect("status" in call.data).toBe(false)
    expect("currentPeriodStart" in call.data).toBe(false)
  })

  test("older event still updates idempotency-safe fields (stripeCustomerId, cancelAtPeriodEnd)", async () => {
    const db = makeFakeDb(NEWER_PERIOD_START)
    const repo = createSubscriptionRepository(db as never)

    await repo.upsertByStripeSubscriptionId({ ...BASE_INPUT, cancelAtPeriodEnd: true })

    const call = db._calls.updateManyCalls[0] as { data: Record<string, unknown> }
    expect(call.data.stripeCustomerId).toBe("cus_test456")
    expect(call.data.cancelAtPeriodEnd).toBe(true)
  })

  test("older event does NOT update plan or billingCycle", async () => {
    const db = makeFakeDb(NEWER_PERIOD_START)
    const repo = createSubscriptionRepository(db as never)

    await repo.upsertByStripeSubscriptionId({ ...BASE_INPUT, plan: "pro", billingCycle: "annual" })

    const call = db._calls.updateManyCalls[0] as { data: Record<string, unknown> }
    expect("plan" in call.data).toBe(false)
    expect("billingCycle" in call.data).toBe(false)
  })

  test("does not reactivate a canceled subscription from a same-period update event", async () => {
    const db = makeFakeDb(CURRENT_PERIOD_START, "canceled")
    const repo = createSubscriptionRepository(db as never)

    await repo.upsertByStripeSubscriptionId({ ...BASE_INPUT, status: "active" })

    const call = db._calls.updateManyCalls[0] as { data: Record<string, unknown> }
    expect("status" in call.data).toBe(false)
  })

  test("creates subscription from scratch when none exists (no existing record)", async () => {
    const db = makeFakeDb(null)
    const repo = createSubscriptionRepository(db as never)

    await repo.upsertByStripeSubscriptionId(BASE_INPUT)

    expect(db.subscription.create).toHaveBeenCalledTimes(1)
    expect(db.subscription.updateMany).not.toHaveBeenCalled()
  })
})
