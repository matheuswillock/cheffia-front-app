import type { PrismaClient, SubscriptionPlan, BillingCycle, SubscriptionStatus } from "@/generated/prisma/client"

export type UpsertSubscriptionInput = {
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  plan: SubscriptionPlan
  billingCycle: BillingCycle
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  tenantId: string
  restaurantId: string
}

export function createSubscriptionRepository(db: PrismaClient) {
  return {
    async upsertByStripeSubscriptionId(input: UpsertSubscriptionInput): Promise<void> {
      // Try to create first; if it already exists, update only when this event is not older.
      // This prevents out-of-order Stripe events from downgrading an active subscription.
      const existing = await db.subscription.findUnique({
        where: { stripeSubscriptionId: input.stripeSubscriptionId },
        select: { currentPeriodStart: true, status: true },
      })

      if (!existing) {
        await db.subscription.create({
          data: {
            tenantId: input.tenantId,
            restaurantId: input.restaurantId,
            stripeCustomerId: input.stripeCustomerId,
            stripeSubscriptionId: input.stripeSubscriptionId,
            stripePriceId: input.stripePriceId,
            plan: input.plan,
            billingCycle: input.billingCycle,
            status: input.status,
            currentPeriodStart: input.currentPeriodStart,
            currentPeriodEnd: input.currentPeriodEnd,
            cancelAtPeriodEnd: input.cancelAtPeriodEnd,
          },
        })
        return
      }

      // Always update idempotency-safe fields; only update period-bound fields when the event is current or
      // newer AND would not revert a terminal cancellation with a stale active-status event.
      const isNewerOrSamePeriod = input.currentPeriodStart >= existing.currentPeriodStart
      const wouldRevertCancellation = existing.status === "canceled" && input.status !== "canceled"
      const shouldUpdatePeriodFields = isNewerOrSamePeriod && !wouldRevertCancellation
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: input.stripeSubscriptionId },
        data: {
          stripeCustomerId: input.stripeCustomerId,
          cancelAtPeriodEnd: input.cancelAtPeriodEnd,
          ...(shouldUpdatePeriodFields
            ? {
                stripePriceId: input.stripePriceId,
                plan: input.plan,
                billingCycle: input.billingCycle,
                status: input.status,
                currentPeriodStart: input.currentPeriodStart,
                currentPeriodEnd: input.currentPeriodEnd,
              }
            : {}),
        },
      })
    },

    async cancelByStripeSubscriptionId(stripeSubscriptionId: string): Promise<void> {
      await db.subscription.updateMany({
        where: { stripeSubscriptionId },
        data: { status: "canceled" },
      })
    },

    async findByRestaurant(
      tenantId: string,
      restaurantId: string
    ) {
      return db.subscription.findUnique({
        where: {
          tenantId_restaurantId: { tenantId, restaurantId },
        },
      })
    },
  }
}
