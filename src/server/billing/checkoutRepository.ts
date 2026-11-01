import type { BillingCycle, SubscriptionPlan } from "@/generated/prisma/client"
import type { CheckoutSessionRepository } from "@/business/billing/createCheckoutSession"
import { getStripeClient } from "@/server/infra/stripe/client"
import { resolvePriceId } from "@/server/infra/stripe/prices"

// Reverse map: (plan, billingCycle) → priceId
// Built from the same PRICE_MAP used in the webhook, so they stay in sync.
const PLAN_CYCLE_TO_PRICE: Record<string, string> = {}

;(function buildReverse() {
  const envPairs: Array<[string, SubscriptionPlan, BillingCycle]> = [
    ["STRIPE_PRICE_BASIC_MONTHLY",      "basic",    "monthly"],
    ["STRIPE_PRICE_BASIC_QUARTERLY",    "basic",    "quarterly"],
    ["STRIPE_PRICE_BASIC_SEMIANNUAL",   "basic",    "semiannual"],
    ["STRIPE_PRICE_BASIC_ANNUAL",       "basic",    "annual"],
    ["STRIPE_PRICE_PRO_MONTHLY",        "pro",      "monthly"],
    ["STRIPE_PRICE_PRO_QUARTERLY",      "pro",      "quarterly"],
    ["STRIPE_PRICE_PRO_SEMIANNUAL",     "pro",      "semiannual"],
    ["STRIPE_PRICE_PRO_ANNUAL",         "pro",      "annual"],
    ["STRIPE_PRICE_COMPLETE_MONTHLY",   "complete", "monthly"],
    ["STRIPE_PRICE_COMPLETE_QUARTERLY", "complete", "quarterly"],
    ["STRIPE_PRICE_COMPLETE_SEMIANNUAL","complete", "semiannual"],
    ["STRIPE_PRICE_COMPLETE_ANNUAL",    "complete", "annual"],
  ]

  const fallbacks: Record<string, string> = {
    STRIPE_PRICE_BASIC_MONTHLY:       "price_1UX47FFZH3QKEcmX8tK1ghi0",
    STRIPE_PRICE_BASIC_QUARTERLY:     "price_1UX47GFZH3QKEcmXO72jMIgP",
    STRIPE_PRICE_BASIC_SEMIANNUAL:    "price_1UX47HFZH3QKEcmXly1yECgx",
    STRIPE_PRICE_BASIC_ANNUAL:        "price_1UX47HFZH3QKEcmX9Dnm7Xcl",
    STRIPE_PRICE_PRO_MONTHLY:         "price_1UX47IFZH3QKEcmXpmVnrMUp",
    STRIPE_PRICE_PRO_QUARTERLY:       "price_1UX47JFZH3QKEcmXU1b0CpfP",
    STRIPE_PRICE_PRO_SEMIANNUAL:      "price_1UX47KFZH3QKEcmXGhGJZJjj",
    STRIPE_PRICE_PRO_ANNUAL:          "price_1UX47KFZH3QKEcmXBCMKkV7j",
    STRIPE_PRICE_COMPLETE_MONTHLY:    "price_1UX47LFZH3QKEcmXAaTP1kzr",
    STRIPE_PRICE_COMPLETE_QUARTERLY:  "price_1UX47MFZH3QKEcmXT2KS3zUt",
    STRIPE_PRICE_COMPLETE_SEMIANNUAL: "price_1UX47MFZH3QKEcmX6xh74LmA",
    STRIPE_PRICE_COMPLETE_ANNUAL:     "price_1UX47NFZH3QKEcmXnGFVNE0A",
  }

  for (const [envKey, plan, cycle] of envPairs) {
    const priceId = process.env[envKey] ?? fallbacks[envKey]
    PLAN_CYCLE_TO_PRICE[`${plan}_${cycle}`] = priceId
  }
})()

export function createCheckoutRepository(): CheckoutSessionRepository {
  return {
    resolvePriceId(plan: SubscriptionPlan, billingCycle: BillingCycle): string | null {
      return PLAN_CYCLE_TO_PRICE[`${plan}_${billingCycle}`] ?? null
    },

    async createSession({ priceId, customerEmail, metadata, successUrl, cancelUrl, paymentMethod, plan, billingCycle }) {
      const stripe = getStripeClient()

      if (paymentMethod === "pix") {
        // Full cycle prices in BRL cents (from PRODUCT.md — must stay in sync)
        const PLAN_CYCLE_CENTS: Record<string, number> = {
          basic_monthly:       9900,
          basic_quarterly:    27000,
          basic_semiannual:   48000,
          basic_annual:       90000,
          pro_monthly:        14900,
          pro_quarterly:      40000,
          pro_semiannual:     72000,
          pro_annual:        134000,
          complete_monthly:   24900,
          complete_quarterly: 67000,
          complete_semiannual: 120000,
          complete_annual:   224000,
        }
        const unitAmount = PLAN_CYCLE_CENTS[`${plan}_${billingCycle}`] ?? 9900

        const pixSession = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["pix"],
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "brl",
                unit_amount: unitAmount,
                product_data: { name: `Cheffia ${plan} — ${billingCycle}` },
              },
            },
          ],
          customer_email: customerEmail,
          metadata,
          success_url: successUrl,
          cancel_url: cancelUrl,
        })

        if (!pixSession.url) throw new Error("Stripe did not return a session URL")
        return { url: pixSession.url }
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: customerEmail,
        subscription_data: { metadata },
        success_url: successUrl,
        cancel_url: cancelUrl,
      })

      if (!session.url) {
        throw new Error("Stripe did not return a session URL")
      }

      return { url: session.url }
    },

    async updateSubscription({ stripeSubscriptionId, priceId, metadata }) {
      const stripe = getStripeClient()

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
