import { expect, test, describe, mock } from "bun:test"
import {
  createCheckoutSession,
  CheckoutSessionError,
  type CheckoutSessionRepository,
} from "@/business/billing/createCheckoutSession"

const BASE_INPUT = {
  tenantId: "tenant-uuid-1",
  restaurantId: "restaurant-uuid-1",
  plan: "basic" as const,
  billingCycle: "monthly" as const,
  userEmail: "owner@example.com",
  successUrl: "https://app.cheffia.app/success",
  cancelUrl: "https://app.cheffia.app/cancel",
}

function makeRepository(
  overrides: Partial<CheckoutSessionRepository> = {}
): CheckoutSessionRepository {
  return {
    resolvePriceId: mock(() => "price_1UX47FFZH3QKEcmX8tK1ghi0"),
    createSession: mock(async () => ({ url: "https://checkout.stripe.com/pay/cs_test_abc" })),
    updateSubscription: mock(async ({ stripeSubscriptionId }) => ({ subscriptionId: stripeSubscriptionId })),
    ...overrides,
  }
}

describe("createCheckoutSession", () => {
  test("returns checkout URL on success", async () => {
    const repo = makeRepository()
    const result = await createCheckoutSession(BASE_INPUT, repo)
    expect(result.url).toBe("https://checkout.stripe.com/pay/cs_test_abc")
  })

  test("passes plan and billingCycle to resolvePriceId", async () => {
    const repo = makeRepository()
    await createCheckoutSession(BASE_INPUT, repo)
    expect(repo.resolvePriceId).toHaveBeenCalledWith("basic", "monthly")
  })

  test("passes tenant and restaurant metadata to createSession", async () => {
    const createSession = mock(async () => ({ url: "https://checkout.stripe.com/pay/cs_test" }))
    const repo = makeRepository({ createSession })
    await createCheckoutSession(BASE_INPUT, repo)
    const call = (createSession.mock.calls[0] as unknown as [{ metadata: Record<string, string> }])[0]
    expect(call.metadata.tenant_id).toBe("tenant-uuid-1")
    expect(call.metadata.restaurant_id).toBe("restaurant-uuid-1")
  })

  test("throws UNKNOWN_PLAN_CYCLE when resolvePriceId returns null", async () => {
    const repo = makeRepository({ resolvePriceId: mock(() => null) })
    expect(createCheckoutSession(BASE_INPUT, repo)).rejects.toThrow(CheckoutSessionError)
    try {
      await createCheckoutSession(BASE_INPUT, repo)
    } catch (err) {
      expect(err instanceof CheckoutSessionError).toBe(true)
      expect((err as CheckoutSessionError).code).toBe("UNKNOWN_PLAN_CYCLE")
    }
  })

  test("does not call createSession when priceId is unknown", async () => {
    const createSession = mock(async () => ({ url: "" }))
    const repo = makeRepository({ resolvePriceId: mock(() => null), createSession })
    try { await createCheckoutSession(BASE_INPUT, repo) } catch { /* expected */ }
    expect(createSession).not.toHaveBeenCalled()
  })
})
