import { afterEach, describe, expect, mock, test } from "bun:test"

// ----- mocks -----
let stripeEvent: Record<string, unknown> | null = null
const upsertByStripeSubscriptionId = mock(async () => {})
const cancelByStripeSubscriptionId = mock(async () => {})
const subscriptionCreate = mock(async (args: unknown) => args)
const resolvePriceIdMock = mock((_priceId: string) => ({ plan: "basic", billingCycle: "monthly" }))

const db = {
  subscription: { create: subscriptionCreate },
}

const stripe = {
  webhooks: { constructEvent: mock(() => stripeEvent) },
  subscriptions: { retrieve: mock(async () => ({})) },
}

mock.module("@/server/infra/stripe/client", () => ({ getStripeClient: () => stripe }))
mock.module("@/server/infra/prisma/client", () => ({ getPrismaClient: () => db }))
mock.module("@/server/infra/stripe/prices", () => ({ resolvePriceId: resolvePriceIdMock }))
mock.module("@/server/billing/subscriptionRepository", () => ({
  createSubscriptionRepository: () => ({
    upsertByStripeSubscriptionId,
    cancelByStripeSubscriptionId,
  }),
}))

const { POST } = await import("@/app/api/internal/stripe/webhook/route")

function webhookRequest(body = "signed-payload") {
  return new Request("https://app/api/internal/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": "sig_test" },
    body,
  })
}

afterEach(() => {
  upsertByStripeSubscriptionId.mockClear()
  cancelByStripeSubscriptionId.mockClear()
  subscriptionCreate.mockClear()
  resolvePriceIdMock.mockClear()
  stripe.webhooks.constructEvent.mockClear()
  stripeEvent = null
})

describe("Stripe webhook — signature and config", () => {
  test("returns 500 when STRIPE_WEBHOOK_SECRET is not set", async () => {
    const prev = process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.STRIPE_WEBHOOK_SECRET
    const res = await POST(webhookRequest())
    expect(res.status).toBe(500)
    process.env.STRIPE_WEBHOOK_SECRET = prev
  })

  test("returns 400 when stripe-signature header is missing", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    const req = new Request("https://app/api/internal/stripe/webhook", {
      method: "POST",
      body: "payload",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test("returns 400 when constructEvent throws (invalid signature)", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripe.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error("No signatures found matching the expected signature")
    })
    const res = await POST(webhookRequest())
    expect(res.status).toBe(400)
  })

  test("returns 200 for unhandled event types without processing", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = { type: "payment_intent.created", data: { object: {} } }
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(upsertByStripeSubscriptionId).not.toHaveBeenCalled()
  })
})

describe("Stripe webhook — subscription events", () => {
  function makeSubscriptionEvent(type: string, overrides: Record<string, unknown> = {}) {
    return {
      type,
      data: {
        object: {
          id: "sub_abc",
          customer: "cus_abc",
          status: "active",
          cancel_at_period_end: false,
          metadata: { tenant_id: "t1", restaurant_id: "r1" },
          items: {
            data: [{
              id: "si_abc",
              price: { id: "price_basic_monthly" },
              current_period_start: 1700000000,
              current_period_end: 1702592000,
            }],
          },
          ...overrides,
        },
      },
    }
  }

  test("customer.subscription.created calls upsert", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makeSubscriptionEvent("customer.subscription.created")
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(upsertByStripeSubscriptionId).toHaveBeenCalledTimes(1)
    expect(cancelByStripeSubscriptionId).not.toHaveBeenCalled()
  })

  test("customer.subscription.updated calls upsert with correct status", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makeSubscriptionEvent("customer.subscription.updated", { status: "past_due" })
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    const call = upsertByStripeSubscriptionId.mock.calls[0]?.[0] as Record<string, unknown>
    expect(call.status).toBe("past_due")
  })

  test("customer.subscription.deleted calls cancelByStripeSubscriptionId", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makeSubscriptionEvent("customer.subscription.deleted")
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(cancelByStripeSubscriptionId).toHaveBeenCalledWith("sub_abc")
    expect(upsertByStripeSubscriptionId).not.toHaveBeenCalled()
  })

  test("ignores subscription event with no items", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makeSubscriptionEvent("customer.subscription.created", { items: { data: [] } })
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(upsertByStripeSubscriptionId).not.toHaveBeenCalled()
  })

  test("ignores subscription event with unknown price ID", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    resolvePriceIdMock.mockReturnValueOnce(null as unknown as { plan: string; billingCycle: string })
    stripeEvent = makeSubscriptionEvent("customer.subscription.created")
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(upsertByStripeSubscriptionId).not.toHaveBeenCalled()
  })

  test("ignores subscription event with missing tenant/restaurant metadata", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makeSubscriptionEvent("customer.subscription.created", { metadata: {} })
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(upsertByStripeSubscriptionId).not.toHaveBeenCalled()
  })
})

describe("Stripe webhook — PIX checkout.session events", () => {
  function makePixSession(type: string, paymentStatus: string, mode = "payment") {
    return {
      type,
      data: {
        object: {
          id: "cs_pix_1",
          mode,
          payment_status: paymentStatus,
          customer: "cus_pix",
          metadata: {
            tenant_id: "t1",
            restaurant_id: "r1",
            plan: "basic",
            billing_cycle: "monthly",
          },
        },
      },
    }
  }

  test("checkout.session.completed with unpaid status does NOT create subscription", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makePixSession("checkout.session.completed", "unpaid")
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(subscriptionCreate).not.toHaveBeenCalled()
  })

  test("checkout.session.async_payment_succeeded with paid status creates subscription", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makePixSession("checkout.session.async_payment_succeeded", "paid")
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(subscriptionCreate).toHaveBeenCalledTimes(1)
    const [call] = subscriptionCreate.mock.calls[0] as unknown as [{ data: Record<string, unknown> }]
    expect(call.data).toMatchObject({
      tenantId: "t1",
      restaurantId: "r1",
      plan: "basic",
      status: "active",
    })
  })

  test("ignores checkout.session event with mode != payment", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makePixSession("checkout.session.completed", "paid", "subscription")
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(subscriptionCreate).not.toHaveBeenCalled()
  })

  test("ignores checkout.session event with missing metadata", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = {
      type: "checkout.session.async_payment_succeeded",
      data: {
        object: {
          id: "cs_pix_2",
          mode: "payment",
          payment_status: "paid",
          metadata: {},
        },
      },
    }
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(subscriptionCreate).not.toHaveBeenCalled()
  })
})

describe("Stripe webhook — invoice.payment_failed", () => {
  function makeInvoiceEvent(subscriptionRef: string | { id: string } | null) {
    return {
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_abc",
          parent: subscriptionRef
            ? { subscription_details: { subscription: subscriptionRef } }
            : null,
        },
      },
    }
  }

  test("invoice.payment_failed retrieves subscription and calls upsert", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripe.subscriptions.retrieve.mockImplementationOnce(async () => ({
      id: "sub_invoice",
      customer: "cus_abc",
      status: "past_due",
      cancel_at_period_end: false,
      metadata: { tenant_id: "t1", restaurant_id: "r1" },
      items: {
        data: [{
          id: "si_abc",
          price: { id: "price_basic_monthly" },
          current_period_start: 1700000000,
          current_period_end: 1702592000,
        }],
      },
    }))
    stripeEvent = makeInvoiceEvent("sub_invoice")
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_invoice")
    expect(upsertByStripeSubscriptionId).toHaveBeenCalledTimes(1)
  })

  test("invoice.payment_failed ignores when subscriptionId is null", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makeInvoiceEvent(null)
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(upsertByStripeSubscriptionId).not.toHaveBeenCalled()
  })

  test("invoice.payment_failed accepts subscriptionRef as object with id", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripe.subscriptions.retrieve.mockImplementationOnce(async () => ({
      id: "sub_obj",
      customer: "cus_abc",
      status: "past_due",
      cancel_at_period_end: false,
      metadata: { tenant_id: "t1", restaurant_id: "r1" },
      items: {
        data: [{
          id: "si_abc",
          price: { id: "price_basic_monthly" },
          current_period_start: 1700000000,
          current_period_end: 1702592000,
        }],
      },
    }))
    stripeEvent = makeInvoiceEvent({ id: "sub_obj" })
    const res = await POST(webhookRequest())
    expect(res.status).toBe(200)
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_obj")
  })
})

describe("Stripe webhook — stripeStatusToPrisma edge cases", () => {
  function makeSubEvent(status: string) {
    return {
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_status",
          customer: "cus_abc",
          status,
          cancel_at_period_end: false,
          metadata: { tenant_id: "t1", restaurant_id: "r1" },
          items: {
            data: [{
              id: "si_abc",
              price: { id: "price_basic_monthly" },
              current_period_start: 1700000000,
              current_period_end: 1702592000,
            }],
          },
        },
      },
    }
  }

  test("incomplete_expired maps to incomplete_expired status", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makeSubEvent("incomplete_expired")
    await POST(webhookRequest())
    const call = upsertByStripeSubscriptionId.mock.calls[0]?.[0] as Record<string, unknown>
    expect(call.status).toBe("incomplete_expired")
  })

  test("unpaid maps to unpaid status", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makeSubEvent("unpaid")
    await POST(webhookRequest())
    const call = upsertByStripeSubscriptionId.mock.calls[0]?.[0] as Record<string, unknown>
    expect(call.status).toBe("unpaid")
  })

  test("trialing (unknown) maps to active", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    stripeEvent = makeSubEvent("trialing")
    await POST(webhookRequest())
    const call = upsertByStripeSubscriptionId.mock.calls[0]?.[0] as Record<string, unknown>
    expect(call.status).toBe("active")
  })
})
