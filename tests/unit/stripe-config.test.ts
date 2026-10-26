import { expect, test } from "bun:test"

import { getStripeClient, stripePromise } from "@/utils/stripe"

test("does not fail module loading when deferred payment configuration is absent", () => {
  expect(stripePromise).toBeNull()
  expect(() => getStripeClient()).toThrow("STRIPE_SECRET_KEY não está definida")
})

test("creates a Stripe client when the secret key is configured", () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_local_only"
  try {
    expect(getStripeClient()).toBeDefined()
  } finally {
    delete process.env.STRIPE_SECRET_KEY
  }
})
