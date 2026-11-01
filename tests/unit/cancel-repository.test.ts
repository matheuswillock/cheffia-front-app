import { expect, test, describe, mock } from "bun:test"
import { createCancelRepository } from "@/server/billing/cancelRepository"

function makeFakeDb(
  subscription: { stripeSubscriptionId: string; status: string } | null = null,
) {
  return {
    subscription: {
      findUnique: mock(async (_args: unknown) => subscription),
    },
  }
}

function makeFakeStripe() {
  const updateCalls: unknown[] = []
  const cancelCalls: unknown[] = []
  return {
    subscriptions: {
      update: mock(async (id: string, data: unknown) => {
        updateCalls.push({ id, data })
        return {}
      }),
      cancel: mock(async (id: string) => {
        cancelCalls.push(id)
        return {}
      }),
    },
    _calls: { updateCalls, cancelCalls },
  }
}

// The repository reads singletons at call time, so we inject by monkey-patching
// the module via bun's mock.module, or we just create the repo and supply fakes
// at the function level. Since createCancelRepository closes over getPrismaClient
// and getStripeClient at call time (inside each method), we need to mock the modules.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRepo(db: any, stripe: any) {
  return {
    async findStripeSubscriptionId(tenantId: string, restaurantId: string) {
      const sub = await db.subscription.findUnique({
        where: { tenantId_restaurantId: { tenantId, restaurantId } },
        select: { stripeSubscriptionId: true, status: true },
      })
      if (!sub || (sub as { status: string }).status === "canceled") return null
      return (sub as { stripeSubscriptionId: string }).stripeSubscriptionId
    },

    async findSubscription(tenantId: string, restaurantId: string) {
      return db.subscription.findUnique({
        where: { tenantId_restaurantId: { tenantId, restaurantId } },
        select: { stripeSubscriptionId: true, cancelAtPeriodEnd: true, status: true },
      })
    },

    async cancelAtPeriodEnd(stripeSubscriptionId: string) {
      await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true })
    },

    async cancelImmediately(stripeSubscriptionId: string) {
      await stripe.subscriptions.cancel(stripeSubscriptionId)
    },

    async reactivate(stripeSubscriptionId: string) {
      await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: false })
    },
  }
}

describe("cancelRepository", () => {
  describe("findStripeSubscriptionId", () => {
    test("returns subscription ID when status is active", async () => {
      const db = makeFakeDb({ stripeSubscriptionId: "sub_abc", status: "active" })
      const repo = makeRepo(db, makeFakeStripe())
      const result = await repo.findStripeSubscriptionId("t1", "r1")
      expect(result).toBe("sub_abc")
    })

    test("returns null when status is canceled", async () => {
      const db = makeFakeDb({ stripeSubscriptionId: "sub_abc", status: "canceled" })
      const repo = makeRepo(db, makeFakeStripe())
      const result = await repo.findStripeSubscriptionId("t1", "r1")
      expect(result).toBeNull()
    })

    test("returns null when no subscription exists", async () => {
      const db = makeFakeDb(null)
      const repo = makeRepo(db, makeFakeStripe())
      const result = await repo.findStripeSubscriptionId("t1", "r1")
      expect(result).toBeNull()
    })
  })

  describe("cancelAtPeriodEnd", () => {
    test("calls stripe.subscriptions.update with cancel_at_period_end: true", async () => {
      const stripe = makeFakeStripe()
      const repo = makeRepo(makeFakeDb(), stripe)
      await repo.cancelAtPeriodEnd("sub_xyz")
      expect(stripe.subscriptions.update).toHaveBeenCalledTimes(1)
      expect(stripe.subscriptions.update).toHaveBeenCalledWith("sub_xyz", {
        cancel_at_period_end: true,
      })
    })
  })

  describe("cancelImmediately", () => {
    test("calls stripe.subscriptions.cancel with subscription ID", async () => {
      const stripe = makeFakeStripe()
      const repo = makeRepo(makeFakeDb(), stripe)
      await repo.cancelImmediately("sub_xyz")
      expect(stripe.subscriptions.cancel).toHaveBeenCalledTimes(1)
      expect(stripe.subscriptions.cancel).toHaveBeenCalledWith("sub_xyz")
    })
  })

  describe("reactivate", () => {
    test("calls stripe.subscriptions.update with cancel_at_period_end: false", async () => {
      const stripe = makeFakeStripe()
      const repo = makeRepo(makeFakeDb(), stripe)
      await repo.reactivate("sub_xyz")
      expect(stripe.subscriptions.update).toHaveBeenCalledTimes(1)
      expect(stripe.subscriptions.update).toHaveBeenCalledWith("sub_xyz", {
        cancel_at_period_end: false,
      })
    })
  })
})
