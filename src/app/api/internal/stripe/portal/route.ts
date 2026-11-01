import { requireRouteSession } from "@/server/auth/routeSession"
import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { createBillingPortalSession, BillingPortalError } from "@/business/billing/createBillingPortalSession"
import { createBillingPortalRepository } from "@/server/billing/billingPortalRepository"
import { getPrismaClient } from "@/server/infra/prisma/client"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const session = await requireRouteSession(request)
  if (!session.ok) return session.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonWithRequestId(request, { code: "INVALID_JSON" }, { status: 400 })
  }

  const { restaurantId, tenantId } = body as Record<string, unknown>

  if (typeof restaurantId !== "string" || !restaurantId) {
    return jsonWithRequestId(request, { code: "RESTAURANT_ID_REQUIRED" }, { status: 400 })
  }
  if (typeof tenantId !== "string" || !tenantId) {
    return jsonWithRequestId(request, { code: "TENANT_ID_REQUIRED" }, { status: 400 })
  }

  const db = getPrismaClient()
  const membership = await db.restaurantMembership.findFirst({
    where: {
      tenantId,
      restaurantId,
      userId: session.user.id,
      status: "active",
      role: { in: ["owner", "manager"] },
    },
    select: { role: true },
  })

  if (!membership) {
    return jsonWithRequestId(request, { code: "FORBIDDEN" }, { status: 403 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  try {
    const result = await createBillingPortalSession(
      {
        tenantId,
        restaurantId,
        returnUrl: `${appUrl}/restaurant/subscription`,
      },
      createBillingPortalRepository()
    )

    return jsonWithRequestId(request, { url: result.url }, { status: 200 })
  } catch (error) {
    if (error instanceof BillingPortalError) {
      if (error.code === "NO_SUBSCRIPTION") {
        return jsonWithRequestId(request, { code: error.code }, { status: 404 })
      }
      return jsonWithRequestId(request, { code: error.code }, { status: 503 })
    }
    console.error("[stripe/portal] session creation failed:", error)
    return jsonWithRequestId(request, { code: "PORTAL_UNAVAILABLE" }, { status: 503 })
  }
}
