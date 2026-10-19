import { expect, test } from "bun:test"

import {
  createOrder,
  type OrderCreationRepository,
} from "@/business/order/createOrder"
import { createOrderRequestSchema } from "@/business/order/orderContracts"

const menuItemId = "00000000-0000-0000-0000-000000000001"

const request = createOrderRequestSchema.parse({
  sessionId: "00000000-0000-0000-0000-000000000003",
  sessionToken: "session-token-12345678",
  items: [{ menuItemId, quantity: 2, modifierIds: [] }],
})

function repository(): OrderCreationRepository & { outboxCount: number } {
  let idempotency: {
    requestHash: string
    status: "started" | "completed"
    responseBody?: {
      orderId: string
      status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "rejected" | "cancelled"
      totalCents: number
    }
  } | null = null
  let outboxCount = 0

  return {
    get outboxCount() {
      return outboxCount
    },
    async transaction(callback) {
      return callback({
        async findActiveSession() {
          return {
            tenantId: "tenant-1",
            restaurantId: "restaurant-1",
            tableId: "table-1",
          }
        },
        async claimIdempotency(input) {
          if (idempotency) {
            return { created: false, record: idempotency }
          }
          idempotency = { requestHash: input.requestHash, status: "started" }
          return { created: true, record: idempotency }
        },
        async findCatalogItems() {
          return [
            {
              id: menuItemId,
              name: "Burger",
              priceCents: 2000,
              currency: "BRL",
              modifierGroups: [],
            },
          ]
        },
        async createOrder(input) {
          return { id: "order-1", status: "pending" as const, totalCents: input.totalCents }
        },
        async createOutboxEvent() {
          outboxCount += 1
        },
        async completeIdempotency(input) {
          if (idempotency) {
            idempotency = { ...idempotency, status: "completed", responseBody: input.responseBody }
          }
        },
      })
    },
  }
}

test("creates one priced order and one outbox event", async () => {
  const repositoryInstance = repository()
  const result = await createOrder({
    repository: repositoryInstance,
    request,
    idempotencyKey: "order-1",
  })

  expect(result).toEqual({ orderId: "order-1", status: "pending", totalCents: 4000 })
  expect(repositoryInstance.outboxCount).toBe(1)
})

test("replays the completed result instead of creating a second order", async () => {
  const repositoryInstance = repository()
  const first = await createOrder({ repository: repositoryInstance, request, idempotencyKey: "order-1" })
  const second = await createOrder({ repository: repositoryInstance, request, idempotencyKey: "order-1" })

  expect(second).toEqual(first)
  expect(repositoryInstance.outboxCount).toBe(1)
})

test("rejects reuse of an idempotency key with a different payload", async () => {
  const repositoryInstance = repository()
  await createOrder({ repository: repositoryInstance, request, idempotencyKey: "order-1" })
  const differentRequest = createOrderRequestSchema.parse({
    ...request,
    items: [{ ...request.items[0], quantity: 1 }],
  })

  await expect(
    createOrder({
      repository: repositoryInstance,
      request: differentRequest,
      idempotencyKey: "order-1",
    }),
  ).rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_REUSE" })
  expect(repositoryInstance.outboxCount).toBe(1)
})
