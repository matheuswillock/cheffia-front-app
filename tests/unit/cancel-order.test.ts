import { expect, test } from "bun:test"

import {
  cancelOrderForCustomer,
  type CancelOrderRepository,
} from "@/business/order/cancelOrder"
import type { OrderStatus } from "@/business/order/orderState"

function repository(initialStatus: OrderStatus): CancelOrderRepository & { transitions: number } {
  let status = initialStatus
  let version = 3
  let transitions = 0

  return {
    get transitions() {
      return transitions
    },
    async transaction(callback) {
      return callback({
        async findOrderForTableSession() {
          return {
            tenantId: "tenant-1",
            restaurantId: "restaurant-1",
            status,
            version,
          }
        },
        async updateStatus(input) {
          if (status !== input.expectedStatus) return null
          status = input.nextStatus
          version += 1
          return version
        },
        async createTransition() {
          transitions += 1
        },
        async createOutboxEvent() {},
      })
    },
  }
}

test("cancels a pending order from its table session and increments its version", async () => {
  const instance = repository("pending")

  await expect(
    cancelOrderForCustomer({
      repository: instance,
      orderId: "order-1",
      sessionId: "session-1",
      sessionToken: "token-1",
    }),
  ).resolves.toEqual({ orderId: "order-1", status: "cancelled", version: 4 })
  expect(instance.transitions).toBe(1)
})

test("does not cancel an order once preparation has started", async () => {
  const instance = repository("preparing")

  await expect(
    cancelOrderForCustomer({
      repository: instance,
      orderId: "order-1",
      sessionId: "session-1",
      sessionToken: "token-1",
    }),
  ).rejects.toMatchObject({ code: "ORDER_TRANSITION_NOT_ALLOWED" })
  expect(instance.transitions).toBe(0)
})
