import type { BillingCycle, SubscriptionPlan } from "@/generated/prisma/client"

export type PriceKey = `${SubscriptionPlan}_${BillingCycle}`

// Maps each Stripe price ID to its canonical (plan, billing_cycle) pair.
// Populated from the Test mode price IDs created via Stripe MCP.
// Override with env vars so the same code works in both Test and Live modes.
const PRICE_MAP: Record<string, { plan: SubscriptionPlan; billingCycle: BillingCycle }> = {
  [env("STRIPE_PRICE_BASIC_MONTHLY", "price_1UX47FFZH3QKEcmX8tK1ghi0")]: {
    plan: "basic",
    billingCycle: "monthly",
  },
  [env("STRIPE_PRICE_BASIC_QUARTERLY", "price_1UX47GFZH3QKEcmXO72jMIgP")]: {
    plan: "basic",
    billingCycle: "quarterly",
  },
  [env("STRIPE_PRICE_BASIC_SEMIANNUAL", "price_1UX47HFZH3QKEcmXly1yECgx")]: {
    plan: "basic",
    billingCycle: "semiannual",
  },
  [env("STRIPE_PRICE_BASIC_ANNUAL", "price_1UX47HFZH3QKEcmX9Dnm7Xcl")]: {
    plan: "basic",
    billingCycle: "annual",
  },
  [env("STRIPE_PRICE_PRO_MONTHLY", "price_1UX47IFZH3QKEcmXpmVnrMUp")]: {
    plan: "pro",
    billingCycle: "monthly",
  },
  [env("STRIPE_PRICE_PRO_QUARTERLY", "price_1UX47JFZH3QKEcmXU1b0CpfP")]: {
    plan: "pro",
    billingCycle: "quarterly",
  },
  [env("STRIPE_PRICE_PRO_SEMIANNUAL", "price_1UX47KFZH3QKEcmXGhGJZJjj")]: {
    plan: "pro",
    billingCycle: "semiannual",
  },
  [env("STRIPE_PRICE_PRO_ANNUAL", "price_1UX47KFZH3QKEcmXBCMKkV7j")]: {
    plan: "pro",
    billingCycle: "annual",
  },
  [env("STRIPE_PRICE_COMPLETE_MONTHLY", "price_1UX47LFZH3QKEcmXAaTP1kzr")]: {
    plan: "complete",
    billingCycle: "monthly",
  },
  [env("STRIPE_PRICE_COMPLETE_QUARTERLY", "price_1UX47MFZH3QKEcmXT2KS3zUt")]: {
    plan: "complete",
    billingCycle: "quarterly",
  },
  [env("STRIPE_PRICE_COMPLETE_SEMIANNUAL", "price_1UX47MFZH3QKEcmX6xh74LmA")]: {
    plan: "complete",
    billingCycle: "semiannual",
  },
  [env("STRIPE_PRICE_COMPLETE_ANNUAL", "price_1UX47NFZH3QKEcmXnGFVNE0A")]: {
    plan: "complete",
    billingCycle: "annual",
  },
}

function env(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export function resolvePriceId(
  priceId: string
): { plan: SubscriptionPlan; billingCycle: BillingCycle } | null {
  return PRICE_MAP[priceId] ?? null
}
