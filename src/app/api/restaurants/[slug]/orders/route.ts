import { requireRouteSession } from "@/server/auth/routeSession"
import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { listKitchenOrders, KitchenOrdersError } from "@/business/order/kitchenOrders"
import { orderStatuses, type OrderStatus } from "@/business/order/orderState"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createKitchenOrdersRepository } from "@/server/ordering/kitchenOrdersRepository"
import { assertPlan } from "@/server/billing/planGate"

export const dynamic = "force-dynamic"

const defaultKitchenStatuses: OrderStatus[] = ["pending", "confirmed", "preparing", "ready"]

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const session = await requireRouteSession(request)
  if (!session.ok) return session.response
  const user = session.user
  const { slug } = await context.params
  const requestedStatuses = new URL(request.url).searchParams.getAll("status")
  const statuses = requestedStatuses.length ? requestedStatuses : defaultKitchenStatuses

  if (statuses.some((status) => !orderStatuses.includes(status as OrderStatus))) {
    return jsonWithRequestId(request, { code: "INVALID_ORDER_STATUS_FILTER" }, { status: 400 })
  }

  const db = getPrismaClient()
  const membership = await db.restaurantMembership.findFirst({
    where: { userId: user.id, status: "active", restaurant: { is: { slug, isActive: true } } },
    select: { tenantId: true, restaurantId: true },
  })
  if (!membership) {
    return jsonWithRequestId(request, { code: "RESTAURANT_NOT_FOUND_OR_FORBIDDEN" }, { status: 403 })
  }
  const gate = await assertPlan(membership.tenantId, membership.restaurantId, "basic")
  if (!gate.ok) return jsonWithRequestId(request, { code: gate.code }, { status: gate.status })

  try {
    const result = await listKitchenOrders({
      repository: createKitchenOrdersRepository(getPrismaClient()),
      restaurantSlug: slug,
      userId: user.id,
      statuses: statuses as OrderStatus[],
    })

    return jsonWithRequestId(request, result.orders, {
      headers: { "Cache-Control": "no-store", "X-Restaurant-Id": result.restaurantId },
    })
  } catch (error) {
    if (error instanceof KitchenOrdersError) {
      return jsonWithRequestId(request, { code: error.code }, { status: 404 })
    }

    console.error("Kitchen order lookup failed")
    return jsonWithRequestId(request, { code: "KITCHEN_ORDERS_UNAVAILABLE" }, { status: 503 })
  }
}
