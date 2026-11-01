import type { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/client"

export type PlanInfo = {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date
}

export type PlanGateRepository = {
  findActiveSubscription(tenantId: string, restaurantId: string): Promise<PlanInfo | null>
}

export type PlanGateResult =
  | { allowed: true; plan: SubscriptionPlan; status: SubscriptionStatus }
  | { allowed: false; reason: "NO_SUBSCRIPTION" | "SUBSCRIPTION_INACTIVE" }

export const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  basic: 0,
  pro: 1,
  complete: 2,
}

export function requiresPlan(requiredPlan: SubscriptionPlan, actualPlan: SubscriptionPlan): boolean {
  return PLAN_HIERARCHY[actualPlan] >= PLAN_HIERARCHY[requiredPlan]
}

export async function getRestaurantPlan(
  tenantId: string,
  restaurantId: string,
  repository: PlanGateRepository
): Promise<PlanGateResult> {
  const subscription = await repository.findActiveSubscription(tenantId, restaurantId)

  if (!subscription) {
    return { allowed: false, reason: "NO_SUBSCRIPTION" }
  }

  const activeStatuses: SubscriptionStatus[] = ["active", "past_due"]
  if (!activeStatuses.includes(subscription.status)) {
    return { allowed: false, reason: "SUBSCRIPTION_INACTIVE" }
  }

  return {
    allowed: true,
    plan: subscription.plan,
    status: subscription.status,
  }
}
