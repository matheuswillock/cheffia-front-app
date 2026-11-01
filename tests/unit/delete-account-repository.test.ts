import { expect, test, describe, mock } from "bun:test"

function makeFakeDb(
  subscription: { stripeSubscriptionId: string; status: string } | null = null,
) {
  const updateCalls: unknown[] = []
  return {
    subscription: {
      findUnique: mock(async (_opts: unknown) => subscription),
    },
    restaurant: {
      update: mock(async (args: unknown) => {
        updateCalls.push(args)
        return {}
      }),
    },
    _calls: { updateCalls },
  }
}

function makeFakeStripe() {
  const cancelCalls: string[] = []
  return {
    subscriptions: {
      cancel: mock(async (id: string) => {
        cancelCalls.push(id)
        return {}
      }),
    },
    _calls: { cancelCalls },
  }
}

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

    async cancelStripeSubscription(stripeSubscriptionId: string) {
      await stripe.subscriptions.cancel(stripeSubscriptionId)
    },

    async deactivateRestaurant(tenantId: string, restaurantId: string) {
      await db.restaurant.update({
        where: { tenantId_id: { tenantId, id: restaurantId } },
        data: { isActive: false },
      })
    },
  }
}

describe("deleteAccountRepository", () => {
  describe("findStripeSubscriptionId", () => {
    test("returns subscription ID when subscription is active", async () => {
      const db = makeFakeDb({ stripeSubscriptionId: "sub_active", status: "active" })
      const repo = makeRepo(db, makeFakeStripe())
      const result = await repo.findStripeSubscriptionId("t1", "r1")
      expect(result).toBe("sub_active")
    })

    test("returns null when status is canceled", async () => {
      const db = makeFakeDb({ stripeSubscriptionId: "sub_old", status: "canceled" })
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

  describe("cancelStripeSubscription", () => {
    test("calls stripe.subscriptions.cancel with the subscription ID", async () => {
      const stripe = makeFakeStripe()
      const repo = makeRepo(makeFakeDb(), stripe)
      await repo.cancelStripeSubscription("sub_todelete")
      expect(stripe.subscriptions.cancel).toHaveBeenCalledTimes(1)
      expect(stripe.subscriptions.cancel).toHaveBeenCalledWith("sub_todelete")
    })
  })

  describe("deactivateRestaurant", () => {
    test("calls db.restaurant.update with isActive: false", async () => {
      const db = makeFakeDb()
      const repo = makeRepo(db, makeFakeStripe())
      await repo.deactivateRestaurant("tenant-1", "restaurant-1")
      expect(db.restaurant.update).toHaveBeenCalledTimes(1)
      const call = db._calls.updateCalls[0] as { data: { isActive: boolean } }
      expect(call.data.isActive).toBe(false)
    })
  })
})
