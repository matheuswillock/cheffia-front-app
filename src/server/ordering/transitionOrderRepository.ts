import type { OrderTransitionRepository } from "@/business/order/transitionOrder"
import type { PrismaClient } from "@/generated/prisma/client"
import { Prisma } from "@/generated/prisma/client"

export function createOrderTransitionRepository(prisma: PrismaClient): OrderTransitionRepository {
  return {
    async transaction(callback) {
      return prisma.$transaction(async (transaction) =>
        callback({
          async findAuthorizedOrder({ orderId, restaurantSlug, userId }) {
            const membership = await transaction.restaurantMembership.findFirst({
              where: {
                userId,
                status: "active",
                restaurant: { is: { slug: restaurantSlug, isActive: true } },
              },
              select: { tenantId: true, restaurantId: true, role: true },
            })
            if (!membership) {
              return null
            }

            const order = await transaction.order.findFirst({
              where: {
                id: orderId,
                tenantId: membership.tenantId,
                restaurantId: membership.restaurantId,
              },
              select: { tenantId: true, restaurantId: true, status: true },
            })
            if (!order) {
              return null
            }

            return {
              tenantId: order.tenantId,
              restaurantId: order.restaurantId,
              status: order.status,
              role: membership.role,
            }
          },

          async updateStatus({ orderId, tenantId, restaurantId, expectedStatus, nextStatus }) {
            const result = await transaction.order.updateMany({
              where: {
                id: orderId,
                tenantId,
                restaurantId,
                status: expectedStatus,
              },
              data: {
                status: nextStatus,
                version: { increment: 1 },
              },
            })
            return result.count === 1
          },

          async createTransition(input) {
            await transaction.orderStateTransition.create({
              data: {
                tenantId: input.tenantId,
                restaurantId: input.restaurantId,
                orderId: input.orderId,
                fromStatus: input.fromStatus,
                toStatus: input.toStatus,
                actorUserId: input.actorUserId,
                actorRole: input.actorRole,
                reason: input.reason,
              },
            })
          },

          async createOutboxEvent({ tenantId, restaurantId, aggregateId, payload }) {
            await transaction.outboxEvent.create({
              data: {
                tenantId,
                restaurantId,
                aggregateType: "order",
                aggregateId,
                eventType: "order.status_changed",
                payload: payload as Prisma.InputJsonValue,
              },
            })
          },
        }),
      )
    },
  }
}
