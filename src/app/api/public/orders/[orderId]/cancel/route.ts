import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { getIdempotencyKey } from "@/business/order/orderContracts"
import { CancelOrderError, CancelOrderRuleError, cancelOrderForCustomer } from "@/business/order/cancelOrder"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createCancelOrderRepository } from "@/server/ordering/cancelOrderRepository"
import { createHash } from "node:crypto"
import { schedulePendingOutboxPublish } from "@/server/ordering/schedulePublish"

export const dynamic = "force-dynamic"

export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const idempotencyKey = getIdempotencyKey(request.headers)
  const sessionId = request.headers.get("X-Table-Session-Id")
  const sessionToken = request.headers.get("X-Table-Session-Token")
  if (!idempotencyKey) return jsonWithRequestId(request, { code: "IDEMPOTENCY_KEY_REQUIRED" }, { status: 400 })
  if (!sessionId || !sessionToken) return jsonWithRequestId(request, { code: "ORDER_SESSION_REQUIRED" }, { status: 401 })
  const { orderId } = await context.params

  try {
    const result = await cancelOrderForCustomer({
      repository: createCancelOrderRepository(getPrismaClient()), orderId, sessionId, sessionToken,
      idempotency: {
        method: "POST", endpoint: `/api/public/orders/${orderId}/cancel`, idempotencyKey,
        requestHash: createHash("sha256").update(JSON.stringify({ orderId, sessionId })).digest("hex"),
      },
    })
    schedulePendingOutboxPublish()
    return jsonWithRequestId(request, result, { headers: { "Cache-Control": "no-store", "Idempotency-Key": idempotencyKey } })
  } catch (error) {
    if (error instanceof CancelOrderError) {
      return jsonWithRequestId(request, { code: error.code }, { status: error.code === "ORDER_NOT_FOUND_OR_FORBIDDEN" ? 404 : 409 })
    }
    if (error instanceof CancelOrderRuleError) return jsonWithRequestId(request, { code: error.code }, { status: 409 })
    console.error("Order cancellation failed")
    return jsonWithRequestId(request, { code: "ORDER_CANCELLATION_UNAVAILABLE" }, { status: 503 })
  }
}
