import { requireRouteSession } from "@/server/auth/routeSession"
import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { CreateTableError, createRestaurantTable } from "@/business/order/createTable"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createRestaurantTableRepository } from "@/server/ordering/createTableRepository"

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const session = await requireRouteSession(request)
  if (!session.ok) return session.response
  const user = session.user
  const { slug } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonWithRequestId(request, { code: "INVALID_TABLE_REQUEST" }, { status: 400 })
  }

  const label = (body as { label?: unknown })?.label
  if (typeof label !== "string") {
    return jsonWithRequestId(request, { code: "INVALID_TABLE_REQUEST" }, { status: 400 })
  }

  const signingSecret = process.env.TABLE_QR_SIGNING_SECRET
  if (!signingSecret) {
    return jsonWithRequestId(request, { code: "TABLE_MANAGEMENT_UNAVAILABLE" }, { status: 503 })
  }

  try {
    const table = await createRestaurantTable({
      repository: createRestaurantTableRepository(getPrismaClient()),
      restaurantSlug: slug,
      userId: user.id,
      label,
      signingSecret,
    })

    return jsonWithRequestId(request,      { ...table, url: new URL(`/table/${table.signedToken}`, request.url).toString() },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    if (error instanceof CreateTableError) {
      return jsonWithRequestId(request,        { code: error.code },
        { status: error.code === "INVALID_TABLE_LABEL" ? 400 : 403 },
      )
    }

    console.error("Restaurant table creation failed")
    return jsonWithRequestId(request, { code: "TABLE_MANAGEMENT_UNAVAILABLE" }, { status: 503 })
  }
}
