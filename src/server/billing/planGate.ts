import type { PrismaClient, SubscriptionPlan } from "@/generated/prisma/client"
import {
  getRestaurantPlan,
  requiresPlan,
  type PlanGateResult,
  type PlanGateRepository,
} from "@/business/billing/getRestaurantPlan"
import { getPrismaClient } from "@/server/infra/prisma/client"

function createPlanGateRepository(db: PrismaClient): PlanGateRepository {
  return {
    async findActiveSubscription(tenantId, restaurantId) {
      return db.subscription.findUnique({
        where: { tenantId_restaurantId: { tenantId, restaurantId } },
        select: {
          plan: true,
          status: true,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: true,
        },
      })
    },
  }
}

export async function getRestaurantPlanFromDb(
  tenantId: string,
  restaurantId: string
): Promise<PlanGateResult> {
  const db = getPrismaClient()
  const repo = createPlanGateRepository(db)
  return getRestaurantPlan(tenantId, restaurantId, repo)
}

export async function assertPlan(
  tenantId: string,
  restaurantId: string,
  requiredPlan: SubscriptionPlan
): Promise<{ ok: true; plan: SubscriptionPlan } | { ok: false; status: 402 | 403; code: string }> {
  const result = await getRestaurantPlanFromDb(tenantId, restaurantId)

  if (!result.allowed) {
    return { ok: false, status: 402, code: result.reason }
  }

  if (!requiresPlan(requiredPlan, result.plan)) {
    return {
      ok: false,
      status: 403,
      code: "PLAN_INSUFFICIENT",
    }
  }

  return { ok: true, plan: result.plan }
}
