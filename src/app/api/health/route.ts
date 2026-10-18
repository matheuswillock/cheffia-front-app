import { getPrismaClient } from "@/server/infra/prisma/client"

export const dynamic = "force-dynamic"

export async function GET() {
  const checkedAt = new Date().toISOString()

  try {
    await getPrismaClient().$queryRaw`SELECT 1`

    return Response.json(
      {
        status: "ok",
        checkedAt,
        dependencies: { database: "ok" },
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    )
  } catch {
    console.error("Health check failed")

    return Response.json(
      {
        status: "degraded",
        checkedAt,
        dependencies: { database: "error" },
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    )
  }
}
