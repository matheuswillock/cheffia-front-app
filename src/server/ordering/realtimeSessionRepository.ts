import type { RealtimeSessionRepository } from "@/business/order/realtimeSession"
import type { PrismaClient } from "@/generated/prisma/client"

export function createRealtimeSessionRepository(prisma: PrismaClient): RealtimeSessionRepository {
  return {
    async hasActiveSession({ orderId, sessionId, sessionTokenHash, now }) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          session: {
            is: {
              id: sessionId,
              tokenHash: sessionTokenHash,
              status: "active",
              expiresAt: { gt: now },
            },
          },
        },
        select: { id: true },
      })

      return Boolean(order)
    },
  }
}
