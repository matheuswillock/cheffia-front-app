import { requireRouteSession } from "@/server/auth/routeSession"
import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { getPrismaClient } from "@/server/infra/prisma/client"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const session = await requireRouteSession(request)
  if (!session.ok) return session.response

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")
  const restaurantId = searchParams.get("restaurantId")

  if (!tenantId || !restaurantId) {
    return jsonWithRequestId(request, { code: "MISSING_PARAMS" }, { status: 400 })
  }

  const db = getPrismaClient()
  const membership = await db.restaurantMembership.findFirst({
    where: {
      tenantId,
      restaurantId,
      userId: session.user.id,
      status: "active",
    },
    select: { role: true },
  })

  if (!membership) {
    return jsonWithRequestId(request, { code: "FORBIDDEN" }, { status: 403 })
  }

  const subscription = await db.subscription.findUnique({
    where: { tenantId_restaurantId: { tenantId, restaurantId } },
    select: {
      plan: true,
      status: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: true,
    },
  })

  if (!subscription) {
    return jsonWithRequestId(request, { hasSubscription: false })
  }

  return jsonWithRequestId(request, {
    hasSubscription: true,
    plan: subscription.plan,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
  })
}
