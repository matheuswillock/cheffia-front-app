import { expect, test } from "bun:test"

import { publishOrderOutboxEvent } from "@/business/order/publishOutbox"

test("publishes the same minimal order event to customer and restaurant private topics", async () => {
  const calls: Array<{ topic: string; payload: unknown }> = []
  await publishOrderOutboxEvent({
    event: {
      id: "event-1", restaurantId: "restaurant-1", aggregateId: "order-1", eventType: "order.status_changed",
      sequence: 4, leaseToken: "lease-1", payload: { orderId: "order-1", status: "confirmed", version: 2 },
    },
    publish: async (topic, payload) => { calls.push({ topic, payload }) },
  })
  expect(calls).toEqual([
    { topic: "order:order-1", payload: { eventId: "event-1", sequence: 2, eventType: "order.status_changed", orderId: "order-1", status: "confirmed", version: 2 } },
    { topic: "restaurant:restaurant-1:orders", payload: { eventId: "event-1", sequence: 2, eventType: "order.status_changed", orderId: "order-1", status: "confirmed", version: 2 } },
  ])
})
