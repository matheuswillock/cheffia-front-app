import { getStripeClient } from "@/server/infra/stripe/client"
import { getPrismaClient } from "@/server/infra/prisma/client"
import type { CancelSubscriptionRepository } from "@/business/billing/cancelSubscription"
import type { ReactivateSubscriptionRepository } from "@/business/billing/reactivateSubscription"

export function createCancelRepository(): CancelSubscriptionRepository & ReactivateSubscriptionRepository {
  return {
    async findStripeSubscriptionId(tenantId, restaurantId) {
      const db = getPrismaClient()
      const sub = await db.subscription.findUnique({
        where: { tenantId_restaurantId: { tenantId, restaurantId } },
        select: { stripeSubscriptionId: true, status: true },
      })
      if (!sub || sub.status === "canceled") return null
      return sub.stripeSubscriptionId
    },

    async findSubscription(tenantId, restaurantId) {
      const db = getPrismaClient()
      return db.subscription.findUnique({
        where: { tenantId_restaurantId: { tenantId, restaurantId } },
        select: { stripeSubscriptionId: true, cancelAtPeriodEnd: true, status: true },
      })
    },

    async cancelAtPeriodEnd(stripeSubscriptionId) {
      const stripe = getStripeClient()
      await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true })
    },

    async cancelImmediately(stripeSubscriptionId) {
      const stripe = getStripeClient()
      await stripe.subscriptions.cancel(stripeSubscriptionId)
    },

    async reactivate(stripeSubscriptionId) {
      const stripe = getStripeClient()
      await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: false })
    },
  }
}
