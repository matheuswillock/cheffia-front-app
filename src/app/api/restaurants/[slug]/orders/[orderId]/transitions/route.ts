import { verifySessionServer } from "@/utils/supabase/server"
import {
  OrderTransitionRuleError,
  TransitionOrderError,
  transitionOrderForStaff,
} from "@/business/order/transitionOrder"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createOrderTransitionRepository } from "@/server/ordering/transitionOrderRepository"
import { orderStatuses, type OrderStatus } from "@/business/order/orderState"
import { createHash } from "node:crypto"
import { getIdempotencyKey } from "@/business/order/orderContracts"
import { schedulePendingOutboxPublish } from "@/server/ordering/schedulePublish"

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; orderId: string }> },
) {
  const user = await verifySessionServer()
  const { slug, orderId } = await context.params
  const idempotencyKey = getIdempotencyKey(request.headers)
  if (!idempotencyKey) return Response.json({ code: "IDEMPOTENCY_KEY_REQUIRED" }, { status: 400 })
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
      idempotency: {
        method: "POST", endpoint: `/api/restaurants/${slug}/orders/${orderId}/transitions`, idempotencyKey,
        requestHash: createHash("sha256").update(JSON.stringify({ status: nextStatus, reason: typeof reason === "string" ? reason.trim() : null })).digest("hex"),
      },
    })
    schedulePendingOutboxPublish()
    return Response.json(result, { status: 200, headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof TransitionOrderError) {
      return Response.json({ code: error.code }, { status: error.code === "ORDER_NOT_FOUND_OR_FORBIDDEN" ? 404 : 409 })
    }
    if (error instanceof OrderTransitionRuleError) {
      return Response.json({ code: error.code }, { status: 409 })
    }
    console.error("Order transition failed")
    return Response.json({ code: "ORDER_TRANSITION_UNAVAILABLE" }, { status: 503 })
  }
}
