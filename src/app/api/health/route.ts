import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { getPrismaClient } from "@/server/infra/prisma/client"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const checkedAt = new Date().toISOString()

  try {
    const prisma = getPrismaClient()
    await prisma.$queryRaw`SELECT 1`
    const outbox = await prisma.outboxEvent.groupBy({ by: ["status"], _count: { _all: true } })
    const oldest = await prisma.outboxEvent.findFirst({
      where: { status: { in: ["pending", "processing"] } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    })
    const counts = Object.fromEntries(outbox.map((entry) => [entry.status, entry._count._all]))

    return jsonWithRequestId(request,      {
        status: "ok",
        checkedAt,
        dependencies: { database: "ok" },
        outbox: {
          pending: counts.pending ?? 0,
          processing: counts.processing ?? 0,
          failed: counts.failed ?? 0,
          oldestPendingSeconds: oldest ? Math.max(0, Math.floor((Date.now() - oldest.createdAt.getTime()) / 1000)) : 0,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    )
  } catch {
    console.error("Health check failed")

    return jsonWithRequestId(request,      {
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
