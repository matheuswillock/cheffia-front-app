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
    return Response.json(
      { code: "ORDER_SESSION_REQUIRED" },
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

    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    if (error instanceof PublicOrderStatusError) {
      return Response.json(
        { code: error.code },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      )
    }

    console.error("Public order status lookup failed")
    return Response.json(
      { code: "ORDER_STATUS_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
