import { requireRouteSession } from "@/server/auth/routeSession"
import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { deleteAccount, DeleteAccountError } from "@/business/billing/deleteAccount"
import { createDeleteAccountRepository } from "@/server/billing/deleteAccountRepository"
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
    where: { tenantId, restaurantId, userId: session.user.id, status: "active", role: "owner" },
    select: { role: true },
  })

  if (!membership) {
    return jsonWithRequestId(request, { code: "FORBIDDEN" }, { status: 403 })
  }

  try {
    await deleteAccount({ tenantId, restaurantId }, createDeleteAccountRepository())
    return jsonWithRequestId(request, { ok: true }, { status: 200 })
  } catch (error) {
    if (error instanceof DeleteAccountError) {
      return jsonWithRequestId(request, { code: error.code }, { status: 503 })
    }
    console.error("[stripe/delete-account] failed:", error)
    return jsonWithRequestId(request, { code: "DELETE_ACCOUNT_UNAVAILABLE" }, { status: 503 })
  }
}
