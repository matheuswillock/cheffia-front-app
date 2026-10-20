import { issueOrderRealtimeToken, RealtimeSessionError } from "@/business/order/realtimeSession"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createRealtimeSessionRepository } from "@/server/ordering/realtimeSessionRepository"
import { jsonWithRequestId } from "@/server/ordering/requestContext"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params
  const sessionId = request.headers.get("X-Table-Session-Id")
  const sessionToken = request.headers.get("X-Table-Session-Token")
  const jwtSecret = process.env.SUPABASE_JWT_SECRET

  if (!sessionId || !sessionToken || !jwtSecret) {
    return jsonWithRequestId(request, { code: "ORDER_SESSION_REQUIRED" }, { status: 401 })
  }

  try {
    const result = await issueOrderRealtimeToken({
      repository: createRealtimeSessionRepository(getPrismaClient()),
      orderId,
      sessionId,
      sessionToken,
      jwtSecret,
    })

    return jsonWithRequestId(request, result, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    if (error instanceof RealtimeSessionError) {
      return jsonWithRequestId(request, { code: error.code }, { status: 404 })
    }

    console.error("Realtime token issuance failed")
    return jsonWithRequestId(request, { code: "ORDER_REALTIME_UNAVAILABLE" }, { status: 503 })
  }
}
