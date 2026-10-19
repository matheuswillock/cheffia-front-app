import { getPublicMenu, PublicMenuError } from "@/business/order/publicMenu"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createPublicMenuRepository } from "@/server/ordering/publicMenuRepository"
import { jsonWithRequestId } from "@/server/ordering/requestContext"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params
  const sessionId = request.headers.get("X-Table-Session-Id")
  const sessionToken = request.headers.get("X-Table-Session-Token")

  if (!sessionId || !sessionToken) {
    return jsonWithRequestId(request,
      { code: "MENU_SESSION_REQUIRED" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    )
  }

  try {
    const menu = await getPublicMenu({
      repository: createPublicMenuRepository(getPrismaClient()),
      restaurantSlug: slug,
      sessionId,
      sessionToken,
    })

    return jsonWithRequestId(request, menu, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof PublicMenuError) {
      return jsonWithRequestId(request,
        { code: "MENU_NOT_AVAILABLE" },
        {
          status: error.code === "MENU_SESSION_REQUIRED" ? 401 : 404,
          headers: { "Cache-Control": "no-store" },
        },
      )
    }

    console.error("Public menu lookup failed")
    return jsonWithRequestId(request,
      { code: "MENU_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
