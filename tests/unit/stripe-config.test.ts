import { expect, test } from "bun:test"

import { getStripeClient, stripePromise } from "@/utils/stripe"

test("does not fail module loading when deferred payment configuration is absent", () => {
  expect(stripePromise).toBeNull()
  expect(() => getStripeClient()).toThrow("STRIPE_SECRET_KEY não está definida")
})
