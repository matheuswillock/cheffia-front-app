import type { PublicOrderStatusRepository } from "@/business/order/orderStatus"
import type { PrismaClient } from "@/generated/prisma/client"

export function createOrderStatusRepository(prisma: PrismaClient): PublicOrderStatusRepository {
  return {
    async findOrder({ orderId, sessionId, sessionTokenHash, now }) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          sessionId,
          session: {
            is: {
              id: sessionId,
              tokenHash: sessionTokenHash,
              status: "active",
              expiresAt: { gt: now },
            },
          },
        },
        select: {
          id: true,
          status: true,
          version: true,
          totalCents: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
          items: {
            orderBy: { createdAt: "asc" },
            select: {
              nameSnapshot: true,
              quantity: true,
              lineTotalCents: true,
            },
          },
        },
      })

      return order
    },
  }
}
