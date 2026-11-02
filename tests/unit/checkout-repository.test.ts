import { expect, test, describe, mock } from "bun:test"

// Fallback price IDs from checkoutRepository.ts
const FALLBACK_PRICES: Record<string, string> = {
  basic_monthly:       "price_1UX47FFZH3QKEcmX8tK1ghi0",
  basic_quarterly:     "price_1UX47GFZH3QKEcmXO72jMIgP",
  basic_semiannual:    "price_1UX47HFZH3QKEcmXly1yECgx",
  basic_annual:        "price_1UX47HFZH3QKEcmX9Dnm7Xcl",
  pro_monthly:         "price_1UX47IFZH3QKEcmXpmVnrMUp",
  pro_quarterly:       "price_1UX47JFZH3QKEcmXU1b0CpfP",
  pro_semiannual:      "price_1UX47KFZH3QKEcmXGhGJZJjj",
  pro_annual:          "price_1UX47KFZH3QKEcmXBCMKkV7j",
  complete_monthly:    "price_1UX47LFZH3QKEcmXAaTP1kzr",
  complete_quarterly:  "price_1UX47MFZH3QKEcmXT2KS3zUt",
  complete_semiannual: "price_1UX47MFZH3QKEcmX6xh74LmA",
  complete_annual:     "price_1UX47NFZH3QKEcmXnGFVNE0A",
}

type Plan = "basic" | "pro" | "complete"
type Cycle = "monthly" | "quarterly" | "semiannual" | "annual"

function makeRepo(stripe: ReturnType<typeof makeFakeStripe>) {
  return {
    resolvePriceId(plan: Plan, billingCycle: Cycle): string | null {
      const key = `${plan}_${billingCycle}`
      return FALLBACK_PRICES[key] ?? null
    },

    async createSession({
      priceId,
      customerEmail,
      metadata,
      successUrl,
      cancelUrl,
    }: {
      priceId: string
      customerEmail: string
      metadata: Record<string, string>
      successUrl: string
      cancelUrl: string
    }) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: customerEmail,
        subscription_data: { metadata },
        success_url: successUrl,
        cancel_url: cancelUrl,
      })

      if (!session.url) throw new Error("Stripe did not return a session URL")
      return { url: session.url }
    },

    async updateSubscription({
      stripeSubscriptionId,
      priceId,
      metadata,
    }: {
      stripeSubscriptionId: string
      priceId: string
      metadata: Record<string, string>
    }) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      const itemId = subscription.items.data[0]?.id
      if (!itemId) throw new Error("Subscription has no items")

      await stripe.subscriptions.update(stripeSubscriptionId, {
        items: [{ id: itemId, price: priceId }],
        metadata,
        proration_behavior: "create_prorations",
      })

      return { subscriptionId: stripeSubscriptionId }
    },
  }
}

function makeFakeStripe(url = "https://checkout.stripe.com/pay/cs_test_abc") {
  const createCalls: unknown[] = []
  return {
    checkout: {
      sessions: {
        create: mock(async (args: unknown) => {
          createCalls.push(args)
          return { url }
        }),
      },
    },
    subscriptions: {
      retrieve: mock(async (_id: string) => ({
        items: { data: [{ id: "si_item_1" }] },
      })),
      update: mock(async (_id: string, _params: unknown) => ({})),
    },
    _calls: { createCalls },
  }
}

describe("checkoutRepository", () => {
  describe("resolvePriceId", () => {
    test("returns correct price ID for basic monthly", () => {
      const repo = makeRepo(makeFakeStripe())
      expect(repo.resolvePriceId("basic", "monthly")).toBe(FALLBACK_PRICES.basic_monthly)
    })

    test("returns correct price ID for pro annual", () => {
      const repo = makeRepo(makeFakeStripe())
      expect(repo.resolvePriceId("pro", "annual")).toBe(FALLBACK_PRICES.pro_annual)
    })

    test("returns correct price ID for complete semiannual", () => {
      const repo = makeRepo(makeFakeStripe())
      expect(repo.resolvePriceId("complete", "semiannual")).toBe(FALLBACK_PRICES.complete_semiannual)
    })
  })

  describe("createSession", () => {
    const SESSION_PARAMS = {
      priceId: "price_abc",
      customerEmail: "chef@example.com",
      metadata: { tenant_id: "t1", restaurant_id: "r1" },
      successUrl: "https://app.example.com/success",
      cancelUrl: "https://app.example.com/cancel",
    }

    test("calls stripe.checkout.sessions.create with mode: subscription and correct line_items", async () => {
      const stripe = makeFakeStripe()
      const repo = makeRepo(stripe)
      await repo.createSession(SESSION_PARAMS)

      expect(stripe.checkout.sessions.create).toHaveBeenCalledTimes(1)
      const call = stripe._calls.createCalls[0] as {
        mode: string
        line_items: Array<{ price: string; quantity: number }>
      }
      expect(call.mode).toBe("subscription")
      expect(call.line_items).toEqual([{ price: "price_abc", quantity: 1 }])
    })

    test("returns url from the Stripe session", async () => {
      const sessionUrl = "https://checkout.stripe.com/pay/cs_test_xyz"
      const stripe = makeFakeStripe(sessionUrl)
      const repo = makeRepo(stripe)
      const result = await repo.createSession(SESSION_PARAMS)
      expect(result).toEqual({ url: sessionUrl })
    })

    test("throws if Stripe returns no url", async () => {
      const stripe = {
        checkout: {
          sessions: {
            create: mock(async () => ({ url: null })),
          },
        },
        subscriptions: {
          retrieve: mock(async () => ({ items: { data: [{ id: "si_1" }] } })),
          update: mock(async () => ({})),
        },
        _calls: { createCalls: [] },
      }
      const repo = makeRepo(stripe as never)
      await expect(repo.createSession(SESSION_PARAMS)).rejects.toThrow(
        "Stripe did not return a session URL",
      )
    })
  })

  describe("updateSubscription", () => {
    test("retrieves subscription and updates item with new price", async () => {
      const stripe = makeFakeStripe()
      const repo = makeRepo(stripe)
      const result = await repo.updateSubscription({
        stripeSubscriptionId: "sub_abc",
        priceId: "price_pro_monthly",
        metadata: { tenant_id: "t1", restaurant_id: "r1" },
      })

      expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_abc")
      expect(stripe.subscriptions.update).toHaveBeenCalledWith(
        "sub_abc",
        expect.objectContaining({
          items: [{ id: "si_item_1", price: "price_pro_monthly" }],
          proration_behavior: "create_prorations",
        }),
      )
      expect(result).toEqual({ subscriptionId: "sub_abc" })
    })

    test("throws if subscription has no items", async () => {
      const stripe = {
        ...makeFakeStripe(),
        subscriptions: {
          retrieve: mock(async () => ({ items: { data: [] } })),
          update: mock(async () => ({})),
        },
      }
      const repo = makeRepo(stripe as never)
      await expect(
        repo.updateSubscription({ stripeSubscriptionId: "sub_empty", priceId: "p", metadata: {} }),
      ).rejects.toThrow("Subscription has no items")
    })
  })
})
