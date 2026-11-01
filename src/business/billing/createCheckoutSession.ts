import type { BillingCycle, SubscriptionPlan } from "@/generated/prisma/client"

export type CheckoutSessionInput = {
  tenantId: string
  restaurantId: string
  plan: SubscriptionPlan
  billingCycle: BillingCycle
  userEmail: string
  successUrl: string
  cancelUrl: string
  existingStripeSubscriptionId?: string
  paymentMethod?: "card" | "pix"
}

export type CheckoutSessionResult = {
  url: string
}

export type CheckoutSessionRepository = {
  resolvePriceId(plan: SubscriptionPlan, billingCycle: BillingCycle): string | null
  createSession(input: {
    priceId: string
    customerEmail: string
    metadata: Record<string, string>
    successUrl: string
    cancelUrl: string
    paymentMethod?: "card" | "pix"
    plan?: SubscriptionPlan
    billingCycle?: BillingCycle
  }): Promise<{ url: string }>
  updateSubscription(input: {
    stripeSubscriptionId: string
    priceId: string
    metadata: Record<string, string>
  }): Promise<{ subscriptionId: string }>
}

export class CheckoutSessionError extends Error {
  constructor(
    public readonly code:
      | "UNKNOWN_PLAN_CYCLE"
      | "SESSION_CREATION_FAILED",
    message?: string
  ) {
    super(message ?? code)
    this.name = "CheckoutSessionError"
  }
}

export function isSamePlanCycle(
  existing: { plan: SubscriptionPlan; billingCycle: BillingCycle; status: string } | null,
  requested: { plan: SubscriptionPlan; billingCycle: BillingCycle }
): boolean {
  if (!existing) return false
  if (!["active", "past_due"].includes(existing.status)) return false
  return existing.plan === requested.plan && existing.billingCycle === requested.billingCycle
}

export async function createCheckoutSession(
  input: CheckoutSessionInput,
  repository: CheckoutSessionRepository
): Promise<CheckoutSessionResult> {
  const priceId = repository.resolvePriceId(input.plan, input.billingCycle)
  if (!priceId) {
    throw new CheckoutSessionError("UNKNOWN_PLAN_CYCLE")
  }

  const metadata = { tenant_id: input.tenantId, restaurant_id: input.restaurantId }

  if (input.existingStripeSubscriptionId) {
    await repository.updateSubscription({
      stripeSubscriptionId: input.existingStripeSubscriptionId,
      priceId,
      metadata,
    })
    return { url: input.cancelUrl }
  }

  const session = await repository.createSession({
    priceId,
    customerEmail: input.userEmail,
    metadata,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    paymentMethod: input.paymentMethod,
    plan: input.plan,
    billingCycle: input.billingCycle,
  })

  return { url: session.url }
}
