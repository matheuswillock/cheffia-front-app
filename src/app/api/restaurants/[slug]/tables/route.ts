import { CreateTableError, createRestaurantTable } from "@/business/order/createTable"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createRestaurantTableRepository } from "@/server/ordering/createTableRepository"
import { verifySessionServer } from "@/utils/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const user = await verifySessionServer()
  const { slug } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ code: "INVALID_TABLE_REQUEST" }, { status: 400 })
  }

  const label = (body as { label?: unknown })?.label
  if (typeof label !== "string") {
    return Response.json({ code: "INVALID_TABLE_REQUEST" }, { status: 400 })
  }

  const signingSecret = process.env.TABLE_QR_SIGNING_SECRET
  if (!signingSecret) {
    return Response.json({ code: "TABLE_MANAGEMENT_UNAVAILABLE" }, { status: 503 })
  }

  try {
    const table = await createRestaurantTable({
      repository: createRestaurantTableRepository(getPrismaClient()),
      restaurantSlug: slug,
      userId: user.id,
      label,
      signingSecret,
    })

    return Response.json(
      { ...table, url: new URL(`/table/${table.signedToken}`, request.url).toString() },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    if (error instanceof CreateTableError) {
      return Response.json(
        { code: error.code },
        { status: error.code === "INVALID_TABLE_LABEL" ? 400 : 403 },
      )
    }

    console.error("Restaurant table creation failed")
    return Response.json({ code: "TABLE_MANAGEMENT_UNAVAILABLE" }, { status: 503 })
  }
}
