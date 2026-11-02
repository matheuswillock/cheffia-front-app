import { expect, test, describe, mock } from "bun:test"
import { createSubscriptionRepository } from "@/server/billing/subscriptionRepository"
import type { SubscriptionPlan, BillingCycle, SubscriptionStatus } from "@/generated/prisma/client"

function makeFakeDb(existingPeriodStart: Date | null = null) {
  const createCalls: unknown[] = []
  const updateManyCalls: unknown[] = []
  const findUniqueCalls: unknown[] = []

  return {
    subscription: {
      create: mock(async (args: unknown) => { createCalls.push(args) }),
      updateMany: mock(async (args: unknown) => { updateManyCalls.push(args) }),
      findUnique: mock(async (args: unknown) => {
        findUniqueCalls.push(args)
        return existingPeriodStart ? { currentPeriodStart: existingPeriodStart } : null
      }),
    },
    _calls: { createCalls, updateManyCalls, findUniqueCalls },
  }
}

const BASE_INPUT = {
  stripeSubscriptionId: "sub_test123",
  stripeCustomerId: "cus_test456",
  stripePriceId: "price_test789",
  plan: "basic" as SubscriptionPlan,
  billingCycle: "monthly" as BillingCycle,
  status: "active" as SubscriptionStatus,
  currentPeriodStart: new Date("2026-11-01T00:00:00Z"),
  currentPeriodEnd: new Date("2026-12-01T00:00:00Z"),
  cancelAtPeriodEnd: false,
  tenantId: "tenant-uuid-1",
  restaurantId: "restaurant-uuid-1",
}

describe("subscriptionRepository", () => {
  describe("upsertByStripeSubscriptionId", () => {
    test("creates subscription when none exists", async () => {
      const db = makeFakeDb(null) // no existing record
      const repo = createSubscriptionRepository(db as never)

      await repo.upsertByStripeSubscriptionId(BASE_INPUT)

      expect(db.subscription.create).toHaveBeenCalledTimes(1)
      expect(db.subscription.updateMany).not.toHaveBeenCalled()
    })

    test("create payload includes tenantId and restaurantId", async () => {
      const db = makeFakeDb(null)
      const repo = createSubscriptionRepository(db as never)

      await repo.upsertByStripeSubscriptionId(BASE_INPUT)

      const call = db._calls.createCalls[0] as {
        data: { tenantId: string; restaurantId: string }
      }
      expect(call.data.tenantId).toBe("tenant-uuid-1")
      expect(call.data.restaurantId).toBe("restaurant-uuid-1")
    })

    test("updates via updateMany when subscription already exists", async () => {
      const olderPeriodStart = new Date("2026-10-01T00:00:00Z")
      const db = makeFakeDb(olderPeriodStart) // existing record with older period
      const repo = createSubscriptionRepository(db as never)

      await repo.upsertByStripeSubscriptionId(BASE_INPUT)

      expect(db.subscription.create).not.toHaveBeenCalled()
      expect(db.subscription.updateMany).toHaveBeenCalledTimes(1)
    })

    test("update payload does not include tenantId or restaurantId", async () => {
      const olderPeriodStart = new Date("2026-10-01T00:00:00Z")
      const db = makeFakeDb(olderPeriodStart)
      const repo = createSubscriptionRepository(db as never)

      await repo.upsertByStripeSubscriptionId(BASE_INPUT)

      const call = db._calls.updateManyCalls[0] as { data: Record<string, unknown> }
      expect("tenantId" in call.data).toBe(false)
      expect("restaurantId" in call.data).toBe(false)
    })
  })

  describe("cancelByStripeSubscriptionId", () => {
    test("sets status to canceled via updateMany", async () => {
      const db = makeFakeDb()
      const repo = createSubscriptionRepository(db as never)

      await repo.cancelByStripeSubscriptionId("sub_test123")

      expect(db.subscription.updateMany).toHaveBeenCalledTimes(1)
      const call = db._calls.updateManyCalls[0] as {
        where: { stripeSubscriptionId: string }
        data: { status: SubscriptionStatus }
      }
      expect(call.where.stripeSubscriptionId).toBe("sub_test123")
      expect(call.data.status).toBe("canceled")
    })
  })

  describe("findByRestaurant", () => {
    test("queries by composite unique key", async () => {
      const db = makeFakeDb()
      const repo = createSubscriptionRepository(db as never)

      await repo.findByRestaurant("tenant-uuid-1", "restaurant-uuid-1")

      expect(db.subscription.findUnique).toHaveBeenCalledTimes(1)
      const call = db._calls.findUniqueCalls[0] as {
        where: { tenantId_restaurantId: { tenantId: string; restaurantId: string } }
      }
      expect(call.where.tenantId_restaurantId).toEqual({
        tenantId: "tenant-uuid-1",
        restaurantId: "restaurant-uuid-1",
      })
    })
  })
})
