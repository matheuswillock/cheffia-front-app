import { expect, test } from "bun:test"

import {
  transitionOrderForStaff,
  type OrderTransitionRepository,
} from "@/business/order/transitionOrder"
import type { OrderStatus } from "@/business/order/orderState"

function repository(): OrderTransitionRepository & { transitionCount: number } {
  let status: OrderStatus = "pending"
  let transitionCount = 0
  let version = 1

  return {
    get transitionCount() {
      return transitionCount
    },
    async transaction(callback) {
      return callback({
        async findAuthorizedOrder() {
          return {
            tenantId: "tenant-1",
            restaurantId: "restaurant-1",
            status,
            role: "kitchen",
            version,
          }
        },
        async updateStatus(input) {
          if (status !== input.expectedStatus) {
            return null
          }
          status = input.nextStatus
          version += 1
          return version
        },
        async createTransition() {
          transitionCount += 1
        },
        async createOutboxEvent() {},
      })
    },
  }
}

test("authorizes kitchen transitions and writes an event", async () => {
  const repositoryInstance = repository()

  const result = await transitionOrderForStaff({
    repository: repositoryInstance,
    orderId: "order-1",
    restaurantSlug: "demo",
    userId: "user-1",
    nextStatus: "confirmed",
  })

  expect(result).toEqual({ orderId: "order-1", status: "confirmed", version: 2 })
  expect(repositoryInstance.transitionCount).toBe(1)
})

test("rejects a customer-forbidden transition without writing", async () => {
  const repositoryInstance = repository()

  await expect(
    transitionOrderForStaff({
      repository: repositoryInstance,
      orderId: "order-1",
      restaurantSlug: "demo",
      userId: "user-1",
      nextStatus: "cancelled",
    }),
  ).rejects.toMatchObject({ code: "ORDER_TRANSITION_NOT_ALLOWED" })
  expect(repositoryInstance.transitionCount).toBe(0)
})
