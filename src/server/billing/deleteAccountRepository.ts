import { getStripeClient } from "@/server/infra/stripe/client"
import { getPrismaClient } from "@/server/infra/prisma/client"
import type { DeleteAccountRepository } from "@/business/billing/deleteAccount"

export function createDeleteAccountRepository(): DeleteAccountRepository {
  return {
    async findStripeSubscriptionId(tenantId: string, restaurantId: string): Promise<string | null> {
      const db = getPrismaClient()
      const sub = await db.subscription.findUnique({
        where: { tenantId_restaurantId: { tenantId, restaurantId } },
        select: { stripeSubscriptionId: true, status: true },
      })
      if (!sub || sub.status === "canceled") return null
      return sub.stripeSubscriptionId
    },

    async cancelStripeSubscription(stripeSubscriptionId: string): Promise<void> {
      const stripe = getStripeClient()
      await stripe.subscriptions.cancel(stripeSubscriptionId)
    },

    async deactivateRestaurant(tenantId: string, restaurantId: string): Promise<void> {
      const db = getPrismaClient()
      await db.restaurant.update({
        where: { tenantId_id: { tenantId, id: restaurantId } },
        data: { isActive: false },
      })
    },
  }
}
