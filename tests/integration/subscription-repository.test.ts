import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type pg from "pg"

import { createSubscriptionRepository } from "@/server/billing/subscriptionRepository"

import { createFixture, createTestPool, createTestPrisma } from "./support/database"

const prisma = createTestPrisma()
const repository = createSubscriptionRepository(prisma)
let pool: pg.Pool

beforeAll(async () => {
  pool = await createTestPool()
})

afterAll(async () => {
  await prisma.$disconnect()
  await pool.end()
})

async function readSubscription(stripeSubscriptionId: string) {
  const result = await pool.query(
    `SELECT
      plan::text AS plan,
      status::text AS status,
      stripe_customer_id,
      stripe_price_id,
      cancel_at_period_end,
      current_period_start,
      current_period_end
     FROM public.subscriptions
     WHERE stripe_subscription_id = $1`,
    [stripeSubscriptionId],
  )
  return result.rows[0] as {
    plan: string
    status: string
    stripe_customer_id: string
    stripe_price_id: string
    cancel_at_period_end: boolean
    current_period_start: Date
    current_period_end: Date
  } | undefined
}

function makeInput(
  tenantId: string,
  restaurantId: string,
  overrides: Partial<Parameters<typeof repository.upsertByStripeSubscriptionId>[0]> = {},
) {
  const now = new Date("2026-11-01T00:00:00Z")
  const nextMonth = new Date("2026-12-01T00:00:00Z")
  return {
    tenantId,
    restaurantId,
    stripeSubscriptionId: `sub_test_${Math.random().toString(36).slice(2, 10)}`,
    stripeCustomerId: "cus_test_base",
    stripePriceId: "price_test_basic_monthly",
    plan: "basic" as const,
    billingCycle: "monthly" as const,
    status: "active" as const,
    currentPeriodStart: now,
    currentPeriodEnd: nextMonth,
    cancelAtPeriodEnd: false,
    ...overrides,
  }
}

describe("upsertByStripeSubscriptionId — create path", () => {
  test("inserts a new subscription when none exists", async () => {
    const fixture = await createFixture(pool)
    const input = makeInput(fixture.tenantId, fixture.restaurantId)

    await repository.upsertByStripeSubscriptionId(input)

    const row = await readSubscription(input.stripeSubscriptionId)
    expect(row).toBeDefined()
    expect(row!.plan).toBe("basic")
    expect(row!.status).toBe("active")
    expect(row!.stripe_customer_id).toBe("cus_test_base")
    expect(row!.cancel_at_period_end).toBe(false)
  })
})

describe("upsertByStripeSubscriptionId — update path", () => {
  test("updates status and plan when event is newer than existing record", async () => {
    const fixture = await createFixture(pool)
    const base = makeInput(fixture.tenantId, fixture.restaurantId, {
      currentPeriodStart: new Date("2026-11-01T00:00:00Z"),
      currentPeriodEnd: new Date("2026-12-01T00:00:00Z"),
      plan: "basic",
      status: "active",
    })
    await repository.upsertByStripeSubscriptionId(base)

    await repository.upsertByStripeSubscriptionId({
      ...base,
      currentPeriodStart: new Date("2026-12-01T00:00:00Z"),
      currentPeriodEnd: new Date("2027-01-01T00:00:00Z"),
      plan: "pro",
      status: "active",
    })

    const row = await readSubscription(base.stripeSubscriptionId)
    expect(row!.plan).toBe("pro")
    expect(row!.current_period_start.toISOString()).toBe("2026-12-01T00:00:00.000Z")
  })

  test("same period is idempotent — updates fields without error", async () => {
    const fixture = await createFixture(pool)
    const base = makeInput(fixture.tenantId, fixture.restaurantId, {
      status: "active",
      cancelAtPeriodEnd: false,
    })
    await repository.upsertByStripeSubscriptionId(base)
    await repository.upsertByStripeSubscriptionId({ ...base, cancelAtPeriodEnd: true })

    const row = await readSubscription(base.stripeSubscriptionId)
    expect(row!.cancel_at_period_end).toBe(true)
  })
})

describe("upsertByStripeSubscriptionId — out-of-order event guard (T13)", () => {
  test("does NOT update status or plan when event period is older than stored", async () => {
    const fixture = await createFixture(pool)
    const newerPeriodStart = new Date("2026-12-01T00:00:00Z")
    const olderPeriodStart = new Date("2026-11-01T00:00:00Z")

    const base = makeInput(fixture.tenantId, fixture.restaurantId, {
      currentPeriodStart: newerPeriodStart,
      currentPeriodEnd: new Date("2027-01-01T00:00:00Z"),
      plan: "pro",
      status: "active",
    })
    await repository.upsertByStripeSubscriptionId(base)

    // Out-of-order event: older period, worse status
    await repository.upsertByStripeSubscriptionId({
      ...base,
      currentPeriodStart: olderPeriodStart,
      currentPeriodEnd: new Date("2026-12-01T00:00:00Z"),
      plan: "basic",
      status: "past_due",
    })

    const row = await readSubscription(base.stripeSubscriptionId)
    expect(row!.plan).toBe("pro")
    expect(row!.status).toBe("active")
    expect(row!.current_period_start.toISOString()).toBe("2026-12-01T00:00:00.000Z")
  })

  test("idempotency-safe fields (stripeCustomerId, cancelAtPeriodEnd) update even on older event", async () => {
    const fixture = await createFixture(pool)
    const newerPeriodStart = new Date("2026-12-01T00:00:00Z")
    const olderPeriodStart = new Date("2026-11-01T00:00:00Z")

    const base = makeInput(fixture.tenantId, fixture.restaurantId, {
      currentPeriodStart: newerPeriodStart,
      stripeCustomerId: "cus_original",
      cancelAtPeriodEnd: false,
    })
    await repository.upsertByStripeSubscriptionId(base)

    await repository.upsertByStripeSubscriptionId({
      ...base,
      currentPeriodStart: olderPeriodStart,
      stripeCustomerId: "cus_updated",
      cancelAtPeriodEnd: true,
    })

    const row = await readSubscription(base.stripeSubscriptionId)
    expect(row!.stripe_customer_id).toBe("cus_updated")
    expect(row!.cancel_at_period_end).toBe(true)
  })
})

describe("cancelByStripeSubscriptionId", () => {
  test("marks an active subscription as canceled", async () => {
    const fixture = await createFixture(pool)
    const input = makeInput(fixture.tenantId, fixture.restaurantId, { status: "active" })
    await repository.upsertByStripeSubscriptionId(input)

    await repository.cancelByStripeSubscriptionId(input.stripeSubscriptionId)

    const row = await readSubscription(input.stripeSubscriptionId)
    expect(row!.status).toBe("canceled")
  })

  test("is a no-op when subscription does not exist", async () => {
    await expect(
      repository.cancelByStripeSubscriptionId("sub_nonexistent_xyz"),
    ).resolves.toBeUndefined()
  })
})

describe("findByRestaurant", () => {
  test("returns the subscription for a restaurant that has one", async () => {
    const fixture = await createFixture(pool)
    const input = makeInput(fixture.tenantId, fixture.restaurantId, { plan: "pro", status: "active" })
    await repository.upsertByStripeSubscriptionId(input)

    const found = await repository.findByRestaurant(fixture.tenantId, fixture.restaurantId)
    expect(found).not.toBeNull()
    expect(found!.plan).toBe("pro")
    expect(found!.status).toBe("active")
  })

  test("returns null for a restaurant without a subscription", async () => {
    const fixture = await createFixture(pool)
    const found = await repository.findByRestaurant(fixture.tenantId, fixture.restaurantId)
    expect(found).toBeNull()
  })
})
