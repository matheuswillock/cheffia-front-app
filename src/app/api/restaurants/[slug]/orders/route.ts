import { listKitchenOrders, KitchenOrdersError } from "@/business/order/kitchenOrders"
import { orderStatuses, type OrderStatus } from "@/business/order/orderState"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createKitchenOrdersRepository } from "@/server/ordering/kitchenOrdersRepository"
import { verifySessionServer } from "@/utils/supabase/server"

export const dynamic = "force-dynamic"

const defaultKitchenStatuses: OrderStatus[] = ["pending", "confirmed", "preparing", "ready"]

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const user = await verifySessionServer()
  const { slug } = await context.params
  const requestedStatuses = new URL(request.url).searchParams.getAll("status")
  const statuses = requestedStatuses.length ? requestedStatuses : defaultKitchenStatuses

  if (statuses.some((status) => !orderStatuses.includes(status as OrderStatus))) {
    return Response.json({ code: "INVALID_ORDER_STATUS_FILTER" }, { status: 400 })
  }

  try {
    const result = await listKitchenOrders({
      repository: createKitchenOrdersRepository(getPrismaClient()),
      restaurantSlug: slug,
      userId: user.id,
      statuses: statuses as OrderStatus[],
    })
    const restaurant = await getPrismaClient().restaurant.findFirst({ where: { slug }, select: { id: true } })

    return Response.json(result, {
      headers: { "Cache-Control": "no-store", ...(restaurant ? { "X-Restaurant-Id": restaurant.id } : {}) },
    })
  } catch (error) {
    if (error instanceof KitchenOrdersError) {
      return Response.json({ code: error.code }, { status: 404 })
    }

    console.error("Kitchen order lookup failed")
    return Response.json({ code: "KITCHEN_ORDERS_UNAVAILABLE" }, { status: 503 })
  }
}
