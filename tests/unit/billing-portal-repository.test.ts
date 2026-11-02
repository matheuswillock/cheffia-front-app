import { expect, test, describe, mock } from "bun:test"

function makeFakeDb(customerId: string | null = null) {
  return {
    subscription: {
      findUnique: mock(async (_opts: unknown) =>
        customerId !== null ? { stripeCustomerId: customerId } : null,
      ),
    },
  }
}

function makeFakeStripe(sessionUrl = "https://billing.stripe.com/session/abc") {
  return {
    billingPortal: {
      sessions: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: mock(async (_opts: any) => ({ url: sessionUrl })),
      },
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRepo(db: any, stripe: any) {
  return {
    async findStripeCustomerId(tenantId: string, restaurantId: string) {
      const sub = await db.subscription.findUnique({
        where: { tenantId_restaurantId: { tenantId, restaurantId } },
        select: { stripeCustomerId: true },
      })
      return (sub as { stripeCustomerId: string } | null)?.stripeCustomerId ?? null
    },

    async createPortalSession(stripeCustomerId: string, returnUrl: string) {
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      })
      return { url: session.url }
    },
  }
}

describe("billingPortalRepository", () => {
  describe("findStripeCustomerId", () => {
    test("returns customer ID when subscription exists", async () => {
      const db = makeFakeDb("cus_test123")
      const repo = makeRepo(db, makeFakeStripe())
      const result = await repo.findStripeCustomerId("t1", "r1")
      expect(result).toBe("cus_test123")
    })

    test("returns null when no subscription exists", async () => {
      const db = makeFakeDb(null)
      const repo = makeRepo(db, makeFakeStripe())
      const result = await repo.findStripeCustomerId("t1", "r1")
      expect(result).toBeNull()
    })
  })

  describe("createPortalSession", () => {
    test("calls stripe.billingPortal.sessions.create with customer and return_url", async () => {
      const stripe = makeFakeStripe()
      const repo = makeRepo(makeFakeDb("cus_abc"), stripe)
      const returnUrl = "https://app.example.com/restaurant/subscription"

      await repo.createPortalSession("cus_abc", returnUrl)

      expect(stripe.billingPortal.sessions.create).toHaveBeenCalledTimes(1)
      expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: "cus_abc",
        return_url: returnUrl,
      })
    })

    test("returns the url from the Stripe session", async () => {
      const sessionUrl = "https://billing.stripe.com/session/xyz"
      const stripe = makeFakeStripe(sessionUrl)
      const repo = makeRepo(makeFakeDb("cus_abc"), stripe)

      const result = await repo.createPortalSession("cus_abc", "https://app.example.com")
      expect(result).toEqual({ url: sessionUrl })
    })
  })
})
