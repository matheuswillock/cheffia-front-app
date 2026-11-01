import { requireRouteSession } from "@/server/auth/routeSession"
import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { reactivateSubscription, ReactivateSubscriptionError } from "@/business/billing/reactivateSubscription"
import { createCancelRepository } from "@/server/billing/cancelRepository"
import { getPrismaClient } from "@/server/infra/prisma/client"

export const dynamic = "force-dynamic"

const MANAGER_ROLES = new Set(["owner", "manager"])

export async function POST(request: Request) {
  const session = await requireRouteSession(request)
  if (!session.ok) return session.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonWithRequestId(request, { code: "INVALID_JSON" }, { status: 400 })
  }

  const { restaurantId, tenantId } = body as Record<string, unknown>

  if (typeof restaurantId !== "string" || !restaurantId) {
    return jsonWithRequestId(request, { code: "RESTAURANT_ID_REQUIRED" }, { status: 400 })
  }
  if (typeof tenantId !== "string" || !tenantId) {
    return jsonWithRequestId(request, { code: "TENANT_ID_REQUIRED" }, { status: 400 })
  }

  const db = getPrismaClient()
  const membership = await db.restaurantMembership.findFirst({
    where: { tenantId, restaurantId, userId: session.user.id, status: "active" },
    select: { role: true },
  })

  if (!membership) {
    return jsonWithRequestId(request, { code: "FORBIDDEN" }, { status: 403 })
  }

  if (!MANAGER_ROLES.has(membership.role)) {
    return jsonWithRequestId(request, { code: "INSUFFICIENT_ROLE" }, { status: 403 })
  }

  try {
    await reactivateSubscription(
      { tenantId, restaurantId },
      createCancelRepository()
    )
    return jsonWithRequestId(request, { ok: true }, { status: 200 })
  } catch (error) {
    if (error instanceof ReactivateSubscriptionError) {
      if (error.code === "NO_SUBSCRIPTION") {
        return jsonWithRequestId(request, { code: error.code }, { status: 404 })
      }
      if (error.code === "NOT_SCHEDULED_FOR_CANCEL") {
        return jsonWithRequestId(request, { code: error.code }, { status: 409 })
      }
    }
    console.error("[stripe/reactivate] subscription reactivation failed:", error)
    return jsonWithRequestId(request, { code: "REACTIVATE_UNAVAILABLE" }, { status: 503 })
  }
}
