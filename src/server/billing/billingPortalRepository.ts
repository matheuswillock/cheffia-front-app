import { getStripeClient } from "@/server/infra/stripe/client"
import { getPrismaClient } from "@/server/infra/prisma/client"
import type { BillingPortalRepository } from "@/business/billing/createBillingPortalSession"

export function createBillingPortalRepository(): BillingPortalRepository {
  return {
    async findStripeCustomerId(tenantId, restaurantId) {
      const db = getPrismaClient()
      const sub = await db.subscription.findUnique({
        where: { tenantId_restaurantId: { tenantId, restaurantId } },
        select: { stripeCustomerId: true },
      })
      return sub?.stripeCustomerId ?? null
    },

    async createPortalSession(stripeCustomerId, returnUrl) {
      const stripe = getStripeClient()
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      })
      return { url: session.url }
    },
  }
}
