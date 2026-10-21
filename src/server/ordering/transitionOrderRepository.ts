import type { OrderTransitionRepository, OrderMutationResult } from "@/business/order/transitionOrder"
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
              select: { tenantId: true, restaurantId: true, status: true, version: true },
            })
            if (!order) {
              return null
            }

            return {
              tenantId: order.tenantId,
              restaurantId: order.restaurantId,
              status: order.status,
              role: membership.role,
              version: order.version,
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
            if (result.count !== 1) return null
            const order = await transaction.order.findUniqueOrThrow({
              where: { id: orderId }, select: { version: true },
            })
            return order.version
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
          async claimIdempotency(input) {
            const inserted = await transaction.idempotencyKey.createMany({
              data: { ...input, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }, skipDuplicates: true,
            })
            if (inserted.count === 1) return { kind: "created" as const }
            const existing = await transaction.idempotencyKey.findUniqueOrThrow({
              where: { tenantId_method_endpoint_idempotencyKey: { tenantId: input.tenantId, method: input.method, endpoint: input.endpoint, idempotencyKey: input.idempotencyKey } },
              select: { requestHash: true, status: true, responseBody: true },
            })
            if (existing.requestHash !== input.requestHash) return { kind: "conflict" as const }
            if (existing.status !== "completed" || !existing.responseBody) return { kind: "in_progress" as const }
            return { kind: "replay" as const, responseBody: existing.responseBody as unknown as OrderMutationResult }
          },
          async completeIdempotency(input) {
            await transaction.idempotencyKey.update({
              where: { tenantId_method_endpoint_idempotencyKey: { tenantId: input.tenantId, method: input.method, endpoint: input.endpoint, idempotencyKey: input.idempotencyKey } },
              data: { status: "completed", responseStatusCode: 200, responseBody: input.responseBody as Prisma.InputJsonValue },
            })
          },
        }),
      )
    },
  }
}
