import { expect, test } from "bun:test"

import { getStripeClient, stripePromise } from "@/utils/stripe"

test("stripePromise is null when publishable key is absent", () => {
  // NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in the test environment
  expect(stripePromise).toBeNull()
})

test("getStripeClient throws when STRIPE_SECRET_KEY is absent", () => {
  const saved = process.env.STRIPE_SECRET_KEY
  delete process.env.STRIPE_SECRET_KEY
  try {
    expect(() => getStripeClient()).toThrow("STRIPE_SECRET_KEY não está definida")
  } finally {
    if (saved !== undefined) process.env.STRIPE_SECRET_KEY = saved
  }
})

test("getStripeClient returns a client when STRIPE_SECRET_KEY is set", () => {
  const saved = process.env.STRIPE_SECRET_KEY
  process.env.STRIPE_SECRET_KEY = "sk_test_local_only"
  try {
    expect(getStripeClient()).toBeDefined()
  } finally {
    if (saved !== undefined) process.env.STRIPE_SECRET_KEY = saved
    else delete process.env.STRIPE_SECRET_KEY
  }
})
