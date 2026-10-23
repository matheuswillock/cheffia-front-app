import { CreateOrderError, createOrder } from "@/business/order/createOrder"
import { getIdempotencyKey, createOrderRequestSchema } from "@/business/order/orderContracts"
import { OrderPricingError } from "@/business/order/orderPricing"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createOrderRepository } from "@/server/ordering/createOrderRepository"
import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { schedulePendingOutboxPublish } from "@/server/ordering/schedulePublish"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const idempotencyKey = getIdempotencyKey(request.headers)
  if (!idempotencyKey) {
    return jsonWithRequestId(request,
      { code: "IDEMPOTENCY_KEY_REQUIRED" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonWithRequestId(request,
      { code: "INVALID_ORDER_REQUEST" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    )
  }

  const parsed = createOrderRequestSchema.safeParse(body)
  if (!parsed.success) {
    return jsonWithRequestId(request,
      { code: "INVALID_ORDER_REQUEST" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    )
  }

  try {
    const result = await createOrder({
      repository: createOrderRepository(getPrismaClient()),
      request: parsed.data,
      idempotencyKey,
    })

    schedulePendingOutboxPublish()

    return jsonWithRequestId(request, result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    if (error instanceof CreateOrderError) {
      const status =
        error.code === "INVALID_ORDER_SESSION"
          ? 401
          : error.code === "IDEMPOTENCY_KEY_REUSE" || error.code === "IDEMPOTENCY_IN_PROGRESS"
            ? 409
            : 400
      return jsonWithRequestId(request,
        { code: error.code },
        { status, headers: { "Cache-Control": "no-store" } },
      )
    }

    if (error instanceof OrderPricingError) {
      return jsonWithRequestId(request,
        { code: error.code },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      )
    }

    console.error(
      "Order creation failed",
      error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    )
    return jsonWithRequestId(request,
      { code: "ORDER_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
