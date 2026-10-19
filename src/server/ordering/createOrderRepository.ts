import type { CatalogMenuItem } from "@/business/order/orderPricing"
import type { OrderCreationRepository } from "@/business/order/createOrder"
import type { PrismaClient } from "@/generated/prisma/client"
import { Prisma } from "@/generated/prisma/client"

export function createOrderRepository(prisma: PrismaClient): OrderCreationRepository {
  return {
    async transaction(callback) {
      return prisma.$transaction(async (transaction) =>
        callback({
          async findActiveSession({ sessionId, sessionTokenHash, now }) {
            return transaction.tableSession.findFirst({
              where: {
                id: sessionId,
                tokenHash: sessionTokenHash,
                status: "active",
                expiresAt: { gt: now },
              },
              select: {
                tenantId: true,
                restaurantId: true,
                tableId: true,
              },
            })
          },

          async claimIdempotency(input) {
            const inserted = await transaction.$queryRaw<
              Array<{ request_hash: string; status: string; response_body: unknown }>
            >(Prisma.sql`
              INSERT INTO public.idempotency_keys
                (tenant_id, restaurant_id, method, endpoint, idempotency_key, request_hash, expires_at)
              VALUES
                (${input.tenantId}::uuid, ${input.restaurantId}::uuid, ${input.method}, ${input.endpoint}, ${input.idempotencyKey}, ${input.requestHash}, ${input.expiresAt})
              ON CONFLICT (tenant_id, method, endpoint, idempotency_key) DO NOTHING
              RETURNING request_hash, status::text, response_body
            `)

            if (inserted[0]) {
              return {
                created: true,
                record: {
                  requestHash: inserted[0].request_hash,
                  status: inserted[0].status as "started" | "completed" | "failed",
                  responseBody: undefined,
                },
              }
            }

            const existing = await transaction.idempotencyKey.findUniqueOrThrow({
              where: {
                tenantId_method_endpoint_idempotencyKey: {
                  tenantId: input.tenantId,
                  method: input.method,
                  endpoint: input.endpoint,
                  idempotencyKey: input.idempotencyKey,
                },
              },
              select: { requestHash: true, status: true, responseBody: true },
            })

            return {
              created: false,
              record: {
                requestHash: existing.requestHash,
                status: existing.status,
                responseBody: existing.responseBody as
                  | { orderId: string; status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "rejected" | "cancelled"; totalCents: number }
                  | undefined,
              },
            }
          },

          async findCatalogItems({ tenantId, restaurantId, menuItemIds }) {
            const items = await transaction.menuItem.findMany({
              where: {
                tenantId,
                restaurantId,
                id: { in: menuItemIds },
                isPublished: true,
                isAvailable: true,
              },
              select: {
                id: true,
                name: true,
                priceCents: true,
                currency: true,
                modifierGroups: {
                  where: { modifierGroup: { is: { isActive: true } } },
                  select: {
                    modifierGroup: {
                      select: {
                        id: true,
                        name: true,
                        minSelections: true,
                        maxSelections: true,
                        modifiers: {
                          where: { isAvailable: true },
                          select: { id: true, name: true, priceDeltaCents: true, isAvailable: true },
                        },
                      },
                    },
                  },
                },
              },
            })

            return items.map((item): CatalogMenuItem => ({
              id: item.id,
              name: item.name,
              priceCents: item.priceCents,
              currency: item.currency,
              modifierGroups: item.modifierGroups.map(({ modifierGroup }) => ({
                id: modifierGroup.id,
                name: modifierGroup.name,
                minSelections: modifierGroup.minSelections,
                maxSelections: modifierGroup.maxSelections,
                modifiers: modifierGroup.modifiers,
              })),
            }))
          },

          async createOrder(input) {
            const order = await transaction.order.create({
              data: {
                tenantId: input.tenantId,
                restaurantId: input.restaurantId,
                tableId: input.tableId,
                sessionId: input.sessionId,
                note: input.note,
                subtotalCents: input.subtotalCents,
                totalCents: input.totalCents,
                currency: input.currency,
                items: {
                  create: input.items.map((item) => ({
                    sourceMenuItemId: item.sourceMenuItemId,
                    nameSnapshot: item.nameSnapshot,
                    quantity: item.quantity,
                    unitPriceCents: item.unitPriceCents,
                    lineTotalCents: item.lineTotalCents,
                    note: item.note,
                    modifiers: {
                      create: item.modifiers.map((modifier) => ({
                        sourceModifierId: modifier.sourceModifierId,
                        nameSnapshot: modifier.nameSnapshot,
                        priceDeltaCents: modifier.priceDeltaCents,
                      })),
                    },
                  })),
                },
              },
              select: { id: true, status: true, totalCents: true },
            })

            return order
          },

          async createOutboxEvent({ tenantId, restaurantId, aggregateId, payload }) {
            await transaction.outboxEvent.create({
              data: {
                tenantId,
                restaurantId,
                aggregateType: "order",
                aggregateId,
                eventType: "order.created",
                payload: payload as Prisma.InputJsonValue,
              },
            })
          },

          async completeIdempotency(input) {
            await transaction.idempotencyKey.update({
              where: {
                tenantId_method_endpoint_idempotencyKey: {
                  tenantId: input.tenantId,
                  method: input.method,
                  endpoint: input.endpoint,
                  idempotencyKey: input.idempotencyKey,
                },
              },
              data: {
                requestHash: input.requestHash,
                status: "completed",
                responseStatusCode: 201,
                responseBody: input.responseBody,
              },
            })
          },
        }),
      )
    },
  }
}
