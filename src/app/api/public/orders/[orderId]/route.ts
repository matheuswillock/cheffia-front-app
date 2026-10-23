import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { getPublicOrderStatus, PublicOrderStatusError } from "@/business/order/orderStatus"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createOrderStatusRepository } from "@/server/ordering/orderStatusRepository"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params
  const sessionId = request.headers.get("X-Table-Session-Id")
  const sessionToken = request.headers.get("X-Table-Session-Token")

  if (!sessionId || !sessionToken) {
    return jsonWithRequestId(request,      { code: "ORDER_SESSION_REQUIRED" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    )
  }

  try {
    const result = await getPublicOrderStatus({
      repository: createOrderStatusRepository(getPrismaClient()),
      orderId,
      sessionId,
      sessionToken,
    })

    return jsonWithRequestId(request, result, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    if (error instanceof PublicOrderStatusError) {
      return jsonWithRequestId(request,        { code: error.code },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      )
    }

    console.error("Public order status lookup failed")
    return jsonWithRequestId(request,      { code: "ORDER_STATUS_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
