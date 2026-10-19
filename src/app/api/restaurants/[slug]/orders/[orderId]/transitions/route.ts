import { verifySessionServer } from "@/utils/supabase/server"
import {
  OrderTransitionRuleError,
  TransitionOrderError,
  transitionOrderForStaff,
} from "@/business/order/transitionOrder"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createOrderTransitionRepository } from "@/server/ordering/transitionOrderRepository"
import { orderStatuses, type OrderStatus } from "@/business/order/orderState"

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; orderId: string }> },
) {
  const user = await verifySessionServer()
  const { slug, orderId } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ code: "INVALID_TRANSITION_REQUEST" }, { status: 400 })
  }

  const nextStatus = (body as { status?: unknown })?.status
  const reason = (body as { reason?: unknown })?.reason
  if (
    typeof nextStatus !== "string" ||
    !orderStatuses.includes(nextStatus as OrderStatus) ||
    (reason !== undefined && typeof reason !== "string")
  ) {
    return Response.json({ code: "INVALID_TRANSITION_REQUEST" }, { status: 400 })
  }

  try {
    const result = await transitionOrderForStaff({
      repository: createOrderTransitionRepository(getPrismaClient()),
      orderId,
      restaurantSlug: slug,
      userId: user.id,
      nextStatus: nextStatus as OrderStatus,
      reason: reason as string | undefined,
    })
    return Response.json(result, { status: 200, headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof TransitionOrderError) {
      return Response.json({ code: error.code }, { status: error.code === "ORDER_STATE_CONFLICT" ? 409 : 404 })
    }
    if (error instanceof OrderTransitionRuleError) {
      return Response.json({ code: error.code }, { status: 409 })
    }
    console.error("Order transition failed")
    return Response.json({ code: "ORDER_TRANSITION_UNAVAILABLE" }, { status: 503 })
  }
}
