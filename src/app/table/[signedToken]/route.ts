import { withRequestId } from "@/server/ordering/requestContext"
import { resolveTableSession, TableSessionError } from "@/business/order/tableSession"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createTableSessionRepository } from "@/server/ordering/tableSessionRepository"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  context: { params: Promise<{ signedToken: string }> },
) {
  const { signedToken } = await context.params
  const signingSecret = process.env.TABLE_QR_SIGNING_SECRET
  const fallback = new URL("/error", request.url)

  if (!signingSecret) {
    return withRequestId(request, NextResponse.redirect(fallback))
  }

  try {
    const session = await resolveTableSession({
      repository: createTableSessionRepository(getPrismaClient()),
      token: signedToken,
      signingSecret,
    })
    const destination = new URL(`/restaurant/menu/${session.restaurantSlug}`, request.url)
    const response = withRequestId(request, NextResponse.redirect(destination))

    response.cookies.set(
      "cheffia_table_session",
      JSON.stringify({
        id: session.sessionId,
        token: session.sessionToken,
        expiresAt: session.expiresAt.toISOString(),
      }),
      {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: session.expiresAt,
      },
    )

    return response
  } catch (error) {
    if (error instanceof TableSessionError) {
      return withRequestId(request, NextResponse.redirect(fallback))
    }

    console.error("Table QR landing failed")
    return withRequestId(request, NextResponse.redirect(fallback))
  }
}
