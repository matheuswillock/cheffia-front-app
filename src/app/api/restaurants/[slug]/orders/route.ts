import { requireRouteSession } from "@/server/auth/routeSession"
import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { listKitchenOrders, KitchenOrdersError } from "@/business/order/kitchenOrders"
import { orderStatuses, type OrderStatus } from "@/business/order/orderState"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createKitchenOrdersRepository } from "@/server/ordering/kitchenOrdersRepository"

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
