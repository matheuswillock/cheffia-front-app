import { afterEach, describe, expect, mock, test } from "bun:test"

let stripeEvent: Record<string, unknown> | null = null
const subscriptionCreate = mock(async (args: unknown) => args)
const subscriptionUpdateMany = mock(async () => ({ count: 1 }))
const stripeSessionCreate = mock(async () => ({ url: "https://checkout.stripe.com/cs_test" }))
const stripeSubscriptionRetrieve = mock(async () => ({
  items: { data: [{ id: "si_existing", price: { id: "price_basic_monthly" } }] },
}))
const stripeSubscriptionUpdate = mock(async () => ({}))

const db = {
  restaurantMembership: { findFirst: mock(async () => ({ role: "owner" })) },
  subscription: {
    findUnique: mock(async (): Promise<{
      stripeSubscriptionId: string
      plan: string
      billingCycle: string
      status: string
    } | null> => ({
      stripeSubscriptionId: "sub_existing",
      plan: "basic",
      billingCycle: "monthly",
      status: "active",
    })),
    create: subscriptionCreate,
    updateMany: subscriptionUpdateMany,
  },
}

const stripe = {
  checkout: { sessions: { create: stripeSessionCreate } },
  subscriptions: {
    retrieve: stripeSubscriptionRetrieve,
    update: stripeSubscriptionUpdate,
  },
  webhooks: {
    constructEvent: mock(() => stripeEvent),
  },
}

mock.module("@/server/auth/routeSession", () => ({
  requireRouteSession: mock(async () => ({
    ok: true,
    user: { id: "user_owner", email: "owner@example.com" },
  })),
}))
mock.module("@/server/infra/prisma/client", () => ({ getPrismaClient: () => db }))
mock.module("@/server/infra/stripe/client", () => ({ getStripeClient: () => stripe }))

const { POST: postCheckout } = await import("@/app/api/internal/stripe/checkout/route")
const { POST: postWebhook } = await import("@/app/api/internal/stripe/webhook/route")

function checkoutRequest(body: Record<string, unknown>) {
  return new Request("https://app.cheffia.app/api/internal/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      plan: "pro",
      billingCycle: "monthly",
      restaurantId: "restaurant_1",
      tenantId: "tenant_1",
      ...body,
    }),
  })
}

afterEach(() => {
  stripeSessionCreate.mockClear()
  stripeSubscriptionRetrieve.mockClear()
  stripeSubscriptionUpdate.mockClear()
  subscriptionCreate.mockClear()
  subscriptionUpdateMany.mockClear()
  db.subscription.findUnique.mockClear()
  stripeEvent = null
})

describe("Stripe checkout payment and plan-change behavior", () => {
  test("updates the existing Stripe subscription when changing plan instead of creating another", async () => {
    await postCheckout(checkoutRequest({ paymentMethod: "card" }))

    expect(stripeSessionCreate).not.toHaveBeenCalled()
    expect(stripeSubscriptionRetrieve).toHaveBeenCalledWith("sub_existing")
    expect(stripeSubscriptionUpdate).toHaveBeenCalledTimes(1)
    const [subscriptionId, update] = stripeSubscriptionUpdate.mock.calls[0] as unknown as [
      string,
      { items: Array<{ id: string; price: string }> },
    ]
    expect(subscriptionId).toBe("sub_existing")
    expect(update.items).toContainEqual({ id: "si_existing", price: expect.any(String) })
    expect(update.items[0]?.price).not.toBe("price_basic_monthly")
  })

  test("creates a one-time PIX checkout for the full selected billing cycle", async () => {
    db.subscription.findUnique.mockImplementationOnce(async () => null)

    await postCheckout(checkoutRequest({
      plan: "basic",
      billingCycle: "quarterly",
      paymentMethod: "pix",
    }))

    const [session] = stripeSessionCreate.mock.calls[0] as unknown as [{
      mode: string
      payment_method_types: string[]
      line_items: Array<{ price_data: { unit_amount: number; currency: string; recurring?: unknown } }>
    }]
    expect(session.mode).toBe("payment")
    expect(session.payment_method_types).toContain("pix")
    expect(session.line_items[0]?.price_data).toMatchObject({
      currency: "brl",
      unit_amount: 27000,
    })
    expect(session.line_items[0]?.price_data?.recurring).toBeUndefined()
  })

  test("activates access only after Stripe confirms a paid PIX checkout", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_pix_paid",
          mode: "payment",
          payment_status: "unpaid",
          amount_total: 27000,
          currency: "brl",
          metadata: {
            tenant_id: "tenant_1",
            restaurant_id: "restaurant_1",
            plan: "basic",
            billing_cycle: "quarterly",
            payment_method: "pix",
          },
        },
      },
    }

    const response = await postWebhook(new Request("https://app.cheffia.app/api/internal/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig_test" },
      body: "signed payload",
    }))

    expect(response.status).toBe(200)
    expect(subscriptionCreate).not.toHaveBeenCalled()

    stripeEvent = {
      type: "checkout.session.async_payment_succeeded",
      data: {
        object: {
          id: "cs_pix_paid",
          mode: "payment",
          payment_status: "paid",
          amount_total: 27000,
          currency: "brl",
          metadata: {
            tenant_id: "tenant_1",
            restaurant_id: "restaurant_1",
            plan: "basic",
            billing_cycle: "quarterly",
            payment_method: "pix",
          },
        },
      },
    }
    const paidResponse = await postWebhook(new Request("https://app.cheffia.app/api/internal/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig_test" },
      body: "signed payload",
    }))

    expect(paidResponse.status).toBe(200)
    expect(subscriptionCreate).toHaveBeenCalledTimes(1)
    const [created] = subscriptionCreate.mock.calls[0] as unknown as [{ data: Record<string, unknown> }]
    expect(created.data).toMatchObject({
      tenantId: "tenant_1",
      restaurantId: "restaurant_1",
      plan: "basic",
      billingCycle: "quarterly",
      status: "active",
    })
  })
})

describe("Stripe checkout route — input validation", () => {
  test("returns 400 for invalid JSON body", async () => {
    const req = new Request("https://app/api/internal/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    })
    const res = await postCheckout(req)
    expect(res.status).toBe(400)
    const body = await res.json() as Record<string, unknown>
    expect(body.code).toBe("INVALID_JSON")
  })

  test("returns 400 for invalid plan", async () => {
    const res = await postCheckout(checkoutRequest({ plan: "enterprise" }))
    expect(res.status).toBe(400)
    const body = await res.json() as Record<string, unknown>
    expect(body.code).toBe("INVALID_PLAN")
  })

  test("returns 400 for invalid billingCycle", async () => {
    const res = await postCheckout(checkoutRequest({ billingCycle: "weekly" }))
    expect(res.status).toBe(400)
    const body = await res.json() as Record<string, unknown>
    expect(body.code).toBe("INVALID_BILLING_CYCLE")
  })

  test("returns 400 when restaurantId is missing", async () => {
    const res = await postCheckout(checkoutRequest({ restaurantId: "" }))
    expect(res.status).toBe(400)
    const body = await res.json() as Record<string, unknown>
    expect(body.code).toBe("RESTAURANT_ID_REQUIRED")
  })

  test("returns 400 when tenantId is missing", async () => {
    const res = await postCheckout(checkoutRequest({ tenantId: "" }))
    expect(res.status).toBe(400)
    const body = await res.json() as Record<string, unknown>
    expect(body.code).toBe("TENANT_ID_REQUIRED")
  })

  test("returns 403 when membership not found", async () => {
    db.restaurantMembership.findFirst.mockImplementationOnce(async () => null)
    const res = await postCheckout(checkoutRequest({}))
    expect(res.status).toBe(403)
    const body = await res.json() as Record<string, unknown>
    expect(body.code).toBe("FORBIDDEN")
  })

  test("returns 503 when Stripe throws", async () => {
    db.subscription.findUnique.mockImplementationOnce(async () => null)
    stripeSessionCreate.mockImplementationOnce(async () => { throw new Error("Stripe down") })
    const res = await postCheckout(checkoutRequest({ plan: "pro" }))
    expect(res.status).toBe(503)
    const body = await res.json() as Record<string, unknown>
    expect(body.code).toBe("CHECKOUT_UNAVAILABLE")
  })
})
