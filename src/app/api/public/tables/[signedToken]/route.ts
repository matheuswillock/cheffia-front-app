import { resolveTableSession, TableSessionError } from "@/business/order/tableSession"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createTableSessionRepository } from "@/server/ordering/tableSessionRepository"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ signedToken: string }> },
) {
  const { signedToken } = await context.params
  const signingSecret = process.env.TABLE_QR_SIGNING_SECRET

  if (!signingSecret) {
    return Response.json(
      { code: "TABLE_SESSION_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }

  try {
    const session = await resolveTableSession({
      repository: createTableSessionRepository(getPrismaClient()),
      token: signedToken,
      signingSecret,
    })

    return Response.json(
      {
        sessionId: session.sessionId,
        sessionToken: session.sessionToken,
        tableId: session.tableId,
        tableLabel: session.tableLabel,
        restaurantId: session.restaurantId,
        restaurantSlug: session.restaurantSlug,
        expiresAt: session.expiresAt.toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    if (error instanceof TableSessionError) {
      return Response.json(
        { code: "TABLE_NOT_AVAILABLE" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      )
    }

    console.error("Table session resolution failed")
    return Response.json(
      { code: "TABLE_SESSION_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
